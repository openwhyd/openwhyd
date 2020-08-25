/**
 * Youtube page scaper + metadata extractor
 */

var ent = require('ent');
var assert = require('assert');
var snip = require('../snip.js');
var htmlDom = require('../models/htmlDom.js');
var trackMatcher = require('../models/trackMatcher.js');

// add fifo queue for api calls to youtube
snip.httpSetDomain(/gdata\.youtube\.com/, { queue: [] });

var SCRAPING_HTTP_OPTIONS = {
  headers: {
    //	"Connection": "keep-alive",
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Accept: 'application/json',
    //	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36",
    'Accept-Language': 'en-US;q=1,en;q=1',
  },
};

function scrape(url, cb) {
  var result = { url: url };
  try {
    snip.httpRequest(url, SCRAPING_HTTP_OPTIONS, function (err, html) {
      if (err) return cb(err, result);
      if (html) result.html = html;
      cb(null, result);
    });
  } catch (err) {
    cb(err, result);
  }
}

function extractMetadataFromYoutubePage(html, cb) {
  var found = /watch\-meta\-item/.test(html);
  if (found) console.log('Parsing metadata from Youtube page...');
  else {
    console.log('Metadata not found from Youtube page => DOC', html);
    cb();
    return;
  }
  htmlDom.parseHtmlDom(html, function (doc) {
    var metadata = {};
    var meta = doc.getElementsByClassName('watch-meta-item');
    for (var i in meta) {
      var type = meta[i].getElementsByClassName('title').pop();
      type = type && type.getText();
      var data = meta[i].getElementsByTagName('li')[0];
      if (!type || !data) {
        console.log('type or data is missing:', type, data);
        continue;
      }
      if (/Purchase/.test(type))
        metadata.trackTitle = data
          .getChildren()[0]
          .getText()
          .replace(/ \($/, '');
      else if (/Artist/.test(type)) metadata.artistName = data.getText();
      //else console.log("unrecognized youtube metadata type:", type);
    }
    for (var i in metadata) {
      metadata[i] = ent.decode(metadata[i]);
      metadata.confidence = 0.9;
    }
    cb(null, metadata);
  });
}

exports.fetchMetadataFromYoutubePage = function (url, cb) {
  scrape(url, function (err, res) {
    if (err || !(res || {}).html) cb(err, res);
    else extractMetadataFromYoutubePage(res.html, cb);
  });
};

exports.translateTrack = function (track) {
  return {
    id: track.id,
    name: track.title,
    desc: track.description,
    duration: track.duration,
  };
};

function translateOutgoingQueryParams(trackMetadata) {
  return { q: trackMetadata.q || trackMatcher.getTrackTitle(trackMetadata) };
  // TODO: add duration filters?
}

function searchYoutubeTracks(q, cb) {
  var url =
    'http://gdata.youtube.com/feeds/api/videos?v=2&alt=jsonc&first-index=0&max-results=5&q=' +
    encodeURIComponent(q);
  return snip.httpRequestJSON(url, null, cb);
}

exports.searchTracks = function (trackMetadata, cb, raw) {
  return searchYoutubeTracks(
    translateOutgoingQueryParams(trackMetadata).q,
    function (err, res) {
      if (err || raw) cb(err, res);
      else
        cb(err, {
          items: (((res || {}).data || {}).items || []).map(
            exports.translateTrack
          ),
        });
    }
  );
};

exports.fetchTrackMetadata = function (trackId, cb, raw) {
  assert.ok(trackId, 'trackId is null');
  var url =
    'https://gdata.youtube.com/feeds/api/videos/' + trackId + '?v=2&alt=jsonc';
  return snip.httpRequestJSON(url, null, function (err, res) {
    if (err || raw) return cb(err, res);
    var data = (res || {}).data;
    if (!data) cb(new Error('invalid youtube reponse: ' + JSON.stringify(res)));
    else {
      var url =
        'http://www.youtube.com/watch?v=' +
        ('' + trackId).replace(/[^a-z0-9\_\-]/gi, '');
      exports.fetchMetadataFromYoutubePage(url, function (err, metadata) {
        var result = exports.translateTrack(data);
        for (var i in metadata) result[i] = metadata[i];
        cb(null, result);
      });
    }
  });
};
