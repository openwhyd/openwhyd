const config = require('../../models/config.js');

const RE_EID = /^\/bc\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
// Bandcamp's CDN serves a JavaScript "Client Challenge" page (instead of the
// track page) to requests that don't look like they come from a regular HTTP
// client, e.g. when the Accept or User-Agent header is missing.
// (cf https://github.com/openwhyd/openwhyd/issues/940)
const FETCH_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; Openwhyd; +https://openwhyd.org)',
};

const RE_STREAM_URL = /https:\/\/[^.]+\.bcbits\.com\/stream\/[^;"]*/g;

const dedup = (array) => [...new Set(array).keys()];

exports.extractBandcampStreamURLs = (plainText) =>
  dedup(plainText.match(RE_STREAM_URL));

exports.extractBandcampStreamURLsFromHTML = (html) => {
  const withDecodedEntities = htmlDecode(html);
  return exports.extractBandcampStreamURLs(withDecodedEntities);
};

function htmlDecode(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
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
    const response = await fetch(
      `https://${artist}.bandcamp.com/track/${track}`,
      { headers: FETCH_HEADERS },
    );
    const body = await response.text();
    const streamURL = exports.extractBandcampStreamURLsFromHTML(body)[0];
    if (!streamURL) {
      throw new Error(
        `no stream URL found in Bandcamp track page (HTTP ${response.status})`,
      );
    }
    res.json({ eId, streamURL });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const sameDomain = (url1, url2) => new URL(url1).host === new URL(url2).host;
