const request = require('request');
const config = require('../../models/config.js');

const RE_EID = /^\/bc\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
const RE_STREAM_URL =
  /https?:\/\/[^./"'\s]+\.bcbits\.com\/stream\/[^;"'\s\\<>]*/g;

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const BROWSER_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

const dedup = (array) => [...new Set(array).keys()];

exports.extractBandcampStreamURLs = (plainText) =>
  dedup(plainText.match(RE_STREAM_URL));

const RE_TRALBUM = /data-tralbum=(["'])(.*?)\1/s;

const parseTralbum = (html) => {
  const matched = String(html).match(RE_TRALBUM);
  if (!matched) return null;
  try {
    return JSON.parse(htmlDecode(matched[2]));
  } catch (err) {
    return null;
  }
};

// fallback: stream URLs listed in data-tralbum, whatever their host or path
const extractStreamURLsFromTralbum = (html) => {
  const trackinfo = (parseTralbum(html) || {}).trackinfo || [];
  return dedup(
    trackinfo
      .flatMap((track) => Object.values((track && track.file) || {}))
      .filter((url) => typeof url === 'string' && /^https?:\/\//.test(url)),
  );
};

exports.extractBandcampStreamURLsFromHTML = (html) => {
  const withDecodedEntities = htmlDecode(html);
  const urls = exports.extractBandcampStreamURLs(withDecodedEntities);
  return urls.length > 0 ? urls : extractStreamURLsFromTralbum(html);
};

// Bandcamp serves an anti-bot "Client Challenge" page instead of the track page to some clients
exports.isBotChallengePage = (html) =>
  /<title>\s*Client Challenge\s*<\/title>/i.test(String(html)) &&
  !RE_TRALBUM.test(String(html));

// short description of a page that doesn't contain any stream URL, for debugging
const describePage = (body) => {
  const html = String(body);
  const tralbum = parseTralbum(html);
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
  return JSON.stringify({
    length: html.length,
    title: title && title.trim().slice(0, 100),
    hasTralbum: !!tralbum,
    trackinfo: tralbum
      ? JSON.stringify(tralbum.trackinfo).slice(0, 300)
      : undefined,
    bcbits: dedup(html.match(/[\w.-]*bcbits\.com[^"'\s<]{0,40}/g) || []).slice(
      0,
      5,
    ),
    start: tralbum ? undefined : html.slice(0, 200),
  });
};

function htmlDecode(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
}

exports.controller = async function (req, reqParams = {}, res) {
  req.logToConsole('bandcampExtractor.controller', reqParams);

  // make sure the API was called from our own domain/host
  const ref = req.getReferer();
  if (typeof ref !== 'string' || !sameDomain(ref, config.urlPrefix)) {
    res.badRequest();
    return;
  }

  const eId = reqParams.eId;
  const matched = typeof eId === 'string' ? eId.match(RE_EID) : null;

  if (!matched) {
    res.badRequest();
    return;
  }

  try {
    const track = matched.pop();
    const artist = matched.pop();
    const { response, body } = await fetch(
      `https://${artist}.bandcamp.com/track/${track}`,
    );
    const streamURL = exports.extractBandcampStreamURLsFromHTML(body)[0];
    if (!streamURL) {
      const status = response && response.statusCode;
      if (exports.isBotChallengePage(body)) {
        console.warn(
          `bandcampExtractor: Bandcamp returned an anti-bot challenge page for ${eId}`,
        );
        res.json({
          eId,
          error: `bandcamp_bot_challenge: Bandcamp served an anti-bot challenge instead of the track page (HTTP status: ${status})`,
        });
        return;
      }
      console.warn(
        `bandcampExtractor: no stream URL found for ${eId} (HTTP status: ${status})`,
      );
      res.json({
        eId,
        error: `no stream URL found on Bandcamp page (HTTP status: ${status}) ${describePage(body)}`,
      });
      return;
    }
    res.json({ eId, streamURL });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const fetchWithRequest = (url) =>
  new Promise((resolve, reject) =>
    request(
      { url, gzip: true, headers: BROWSER_HEADERS },
      (error, response, body) =>
        error ? reject(error) : resolve({ response, body }),
    ),
  );

// Bandcamp's anti-bot challenge is triggered by Node's TLS fingerprint, so we retry
// with a client that impersonates a browser's TLS/HTTP2 fingerprint (like yt-dlp does)
const fetchWithBrowserImpersonation = async (url) => {
  const { Impit } = require('impit');
  const response = await new Impit({ browser: 'chrome' }).fetch(url, {
    headers: BROWSER_HEADERS,
  });
  return {
    response: { statusCode: response.status },
    body: await response.text(),
  };
};

const fetch = async (url) => {
  const result = await fetchWithRequest(url);
  if (!exports.isBotChallengePage(result.body)) return result;
  console.warn('bandcampExtractor: got challenge page, retrying with impit');
  return fetchWithBrowserImpersonation(url);
};

const sameDomain = (url1, url2) => new URL(url1).host === new URL(url2).host;
