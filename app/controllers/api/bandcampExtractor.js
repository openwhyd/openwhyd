const request = require('request');
const config = require('../../models/config.js');

const RE_EID = /^\/bc\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
const RE_STREAM_URL =
  /https?:\/\/[^./"'\s]+\.bcbits\.com\/stream\/[^;"'\s\\<>]*/g;

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

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
    const { body } = await fetch(
      `https://${artist}.bandcamp.com/track/${track}`,
    );
    res.json({
      eId,
      streamURL: exports.extractBandcampStreamURLsFromHTML(body)[0],
    });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const fetch = (url) =>
  new Promise((resolve, reject) =>
    request(
      { url, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' } },
      (error, response, body) =>
        error ? reject(error) : resolve({ response, body }),
    ),
  );

const sameDomain = (url1, url2) => new URL(url1).host === new URL(url2).host;
