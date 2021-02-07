const request = require('request');
var config = require('../../models/config.js');

const RE_EID = /^\/bc\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
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
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
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
      `https://${artist}.bandcamp.com/track/${track}`
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
    request(url, (error, response, body) =>
      error ? reject(error) : resolve({ response, body })
    )
  );

const sameDomain = (url1, url2) => new URL(url1).host === new URL(url2).host;
