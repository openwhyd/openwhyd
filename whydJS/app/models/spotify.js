var assert = require('assert')
var querystring = require('querystring')
var snip = require('../snip.js')
var trackMatcher = require('../models/trackMatcher.js')

// add fifo queue for api calls to spotify
snip.httpSetDomain(/ws\.spotify\.com/, { queue: [] })

function getIsrc (external) {
  for (var i in external) {
    if (external[i].type == 'isrc') { return external[i].id }
  }
}

exports.translateTrack = function (track) {
  return {
    id: track.href,
    artistName: track.artists.map(function (a) { return a.name }).join(', '),
    trackTitle: track.name,
    isrc: getIsrc(track['external-ids']),
    duration: track.length ? Math.floor(track.length) : undefined, // in seconds
    albumTitle: track.album.name,
    albumYear: track.album.released
  }
}

function querySpotify (q, cb) {
  var url = 'http://ws.spotify.com/search/1/track.json?q=' + encodeURIComponent(q || '')
  return snip.httpRequestJSON(url, null, cb)
}

function translateOutgoingQueryParams (trackMetadata) {
  return {q: trackMetadata.q || trackMatcher.getTrackTitle(trackMetadata)}
}

exports.searchTracks = function (p, cb, raw) {
  querySpotify(translateOutgoingQueryParams(p).q, function (err, res) {
    if (err || raw) { cb(err, res) } else {
      cb(null, {
        items: ((res || {}).tracks).map(exports.translateTrack)
      })
    }
  })
}
/*
exports.searchByIsrc = function(isrc, cb) {
	return querySpotify("isrc:" + isrc, function(res){
		cb(res || {});
	});
}
*/
exports.fetchTrackMetadata = function (trackId, cb, raw) {
  var trackId = ('' + trackId).split(':').pop()
  assert.ok(trackId, 'trackId is null')
  var url = 'http://ws.spotify.com/lookup/1/.json?uri=spotify:track:' + trackId
  // console.log(url);
  snip.httpRequestJSON(url, {}, function (err, res) {
    if (err || raw) { cb(err, res) } else { cb(null, exports.translateTrack(res.track)) }
  })
}
