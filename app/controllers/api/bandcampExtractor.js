const request = require('request');
const config = require('../../models/config.js');

const RE_EID = /^\/bc\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
const RE_STREAM_URL = /https?:\/\/[^.]+\.bcbits\.com\/stream\/[^;"'<\s]*/g;
const RE_DATA_TRALBUM = /data-tralbum=(["'])([\s\S]*?)\1/;
const RE_STREAM_URL_SINGLE =
  /^https?:\/\/[^.]+\.bcbits\.com\/stream\/[^;"'<\s]*$/;

const dedup = (array = []) => [...new Set(array).keys()];

const decodeEscapedString = (string) =>
  String(string)
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');

exports.extractBandcampStreamURLs = (plainText) =>
  dedup(decodeEscapedString(plainText).match(RE_STREAM_URL) || []);

exports.extractBandcampStreamURLsFromHTML = (html) => {
  const withDecodedEntities = htmlDecode(html);
  return dedup([
    ...extractTrackInfoStreamURLs(withDecodedEntities),
    ...exports.extractBandcampStreamURLs(withDecodedEntities),
  ]);
};

function htmlDecode(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function extractTrackInfoStreamURLs(html) {
  const matched = String(html).match(RE_DATA_TRALBUM);
  if (!matched) {
    return [];
  }
  try {
    const tralbumData = JSON.parse(decodeEscapedString(matched[2]));
    return dedup(
      (tralbumData.trackinfo || [])
        .flatMap(({ file = {} }) => Object.values(file))
        .map(decodeEscapedString)
        .filter((url) => RE_STREAM_URL_SINGLE.test(url)),
    );
  } catch (err) {
    return [];
  }
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
    const streamURL = exports.extractBandcampStreamURLsFromHTML(body)[0];
    if (!streamURL) {
      throw new Error('Could not extract Bandcamp stream URL from track page');
    }
    res.json({
      eId,
      streamURL,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
};

const fetch = (url) =>
  new Promise((resolve, reject) =>
    request(url, (error, response, body) =>
      error ? reject(error) : resolve({ response, body }),
    ),
  );

const sameDomain = (url1, url2) => new URL(url1).host === new URL(url2).host;
