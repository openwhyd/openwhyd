/**
 * Soundcloud track lookup and metadata extraction
 */

var assert = require('assert');
var snip = require('../snip.js');
var trackMatcher = require('../models/trackMatcher.js');

var CLIENT_ID = 'eb257e698774349c22b0b727df0238ad';

// add fifo queue for api calls to soundcloud
snip.httpSetDomain(/api\.soundcloud\.com/, { queue: [] });

exports.translateTrack = function(track) {
  //console.log("track", track);
  var title = track.title;
  assert.ok(title, 'no title was found in track:' + JSON.stringify(track));
  if (title.indexOf(' - ') == -1) title = track.user.username + ' - ' + title;
  return {
    id: track.id,
    uri: track.permalink_url.split('soundcloud.com/').pop() + '#' + track.uri,
    //eId: "/sc/" + track.permalink_url.split("soundcloud.com\/").pop() + "#" + track.uri,
    //img: track.artwork_url,
    //name: (track.title && track.user && track.title.indexOf(" - ") == -1 ? track.user.username + " - " : "") + track.title;
    name: title,
    desc: track.description,
    duration: Math.floor(track.duration / 1000)
  };
};

function searchSoundcloudTracks(q, cb) {
  var url =
    'http://api.soundcloud.com/tracks.json?client_id=' +
    CLIENT_ID +
    '&q=' +
    encodeURIComponent(q);
  return snip.httpRequestJSON(url, null, cb);
}

function translateOutgoingQueryParams(trackMetadata) {
  return { q: trackMetadata.q || trackMatcher.getTrackTitle(trackMetadata) };
  // TODO: add duration filters?
}

exports.searchTracks = function(trackMetadata, cb, raw) {
  return searchSoundcloudTracks(
    translateOutgoingQueryParams(trackMetadata).q,
    function(err, res) {
      if (err || raw) cb(err, res);
      else if (res && !res.map) {
        // e.g. res = { errors: [ { error_message: '503 - Service Unavailable' } ] }
        var ERR_MSG = 'invalid result from searchSoundcloudTracks';
        if (res.errors)
          ERR_MSG += ': ' + res.errors[0].error_message || JSON.stringify(res);
        //console.error(ERR_MSG, res);
        cb(new Error(ERR_MSG));
      } else
        cb(null, {
          items: (res || []).map(exports.translateTrack)
        });
    }
  );
};

function fetchMetadataFromUrl(url, cb, raw) {
  //console.log(url, "...");
  snip.httpRequestJSON(url, {}, function(err, res) {
    //console.log("=> ", err, res);
    if (err || raw) cb(err, res);
    else if (res && (!res.id || !res.title)) {
      // soundcloud api error or redirection
      if (res.location) fetchMetadataFromUrl(res.location, cb, raw);
      else
        cb(
          new Error(
            'Unrecognized response from soundcloud: ' + JSON.stringify(res)
          )
        );
    } else cb(null, exports.translateTrack(res));
  });
}

function ensureScUrl(url) {
  url = url.split('#')[0];
  if (url.indexOf('//') == -1)
    return 'http://' + ('soundcloud.com/' + url).replace(/\/\//g, '/');
  else if (url.indexOf('//') == 0) return 'http:' + url;
  else return url;
}

exports.fetchTrackMetadata = function(trackId, cb, raw) {
  assert.ok(trackId, 'trackId is null');
  var trackId = '' + trackId;
  var url =
    'https://api.soundcloud.com' +
    ('' + parseInt(trackId) === trackId
      ? '/tracks/' +
        encodeURIComponent(trackId) +
        '.json?client_id=' +
        CLIENT_ID
      : '/resolve.json?client_id=' +
        CLIENT_ID +
        '&url=' +
        encodeURIComponent(ensureScUrl(trackId)));
  console.log('URL', url, '...');
  fetchMetadataFromUrl(url, cb, raw);
};
