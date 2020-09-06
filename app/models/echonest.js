var assert = require('assert');
var querystring = require('querystring');
var snip = require('../snip.js');

var ECHONEST_API_KEY = 'THPZEU9N7TCVO7CAH'; // found in API documentation
var DURATION_TOLERANCE = 10; // seconds

// add fifo queue for api calls to echonest
snip.httpSetDomain(/developer\.echonest\.com/, { queue: [] });

function queryEchonest(p, cb) {
  p = p || {};
  p.api_key = ECHONEST_API_KEY;
  p.bucket = [
    'audio_summary',
    'tracks',
    'id:deezer',
    'id:spotify-WW' /*, "id:musicbrainz", "id:discogs"*/,
  ];
  var url =
    'http://developer.echonest.com/api/v4/song/search?' +
    querystring.stringify(p);
  return snip.httpRequestJSON(url, null, cb);
}

var SEARCH_FIELD_MAPPING = {
  artistName: 'artist',
  trackTitle: 'title',
};

// cf http://developer.echonest.com/docs/v4/song.html
function translateOutgoingQueryParams(p) {
  p = p || {};
  var res =
    p.artistName && p.trackTitle
      ? snip.filterFields(p, SEARCH_FIELD_MAPPING)
      : { combined: p.name };
  if (p.duration) {
    res.max_duration = p.duration + DURATION_TOLERANCE;
    res.min_duration = p.duration - DURATION_TOLERANCE;
  }
  return res;
}

exports.translateTrack = function (track) {
  var res = {
    id: track.id,
    artistName: track.artist_name || track.artist,
    trackTitle: track.title || track.title,
    //albumTitle: track.tracks,
  };
  if (track.tracks && track.tracks.length) {
    // 1) album data
    if (track.tracks[0].album_name) {
      res.albumTitle = track.tracks[0].album_name;
      if (track.tracks[0].album_date)
        res.albumYear = track.tracks[0].album_date.substr(0, 4);
    }
    // 2) foreign ids
    var tracks = track.tracks;
    res.foreignIds = {};
    for (let i in tracks)
      if (!res.foreignIds[tracks[i].catalog])
        res.foreignIds[tracks[i].catalog] = tracks[i].foreign_id;
  }
  // 3) duration
  if (track.audio_summary && track.audio_summary.duration)
    res.duration = track.audio_summary.duration;
  return res;
};

function searchTracks(p, cb, raw) {
  queryEchonest(translateOutgoingQueryParams(p), function (err, res) {
    if (err || raw) cb(err, res);
    else
      cb(null, {
        items: (((res || {}).response || {}).songs || []).map(
          exports.translateTrack
        ),
      });
  });
}

exports.fetchTrackMetadata = function (trackId, cb, raw) {
  assert.ok(trackId, 'trackId is null');
  var p = {
    id: trackId,
    api_key: ECHONEST_API_KEY,
    bucket: 'audio_summary',
  };
  var url =
    'http://developer.echonest.com/api/v4/track/profile?' +
    querystring.stringify(p);
  //console.log("url", url);
  return snip.httpRequestJSON(url, null, function (err, res) {
    //console.log("EN", err, res)
    if (err || raw) return cb(err, res);
    var data = (res || {}).response;
    if (!data) cb(new Error("no data was found in echonest's reponse"));
    else {
      //data.track.tracks = [data.track];
      //console.log(data.track)
      cb(null, exports.translateTrack(data.track));
    }
  });
};

// test:
// searchTracks({artistName:"émilie simon", trackTitle:"dreamland"}, console.log);

// test from node CLI:
// require("./app/models/echonest.js").searchTracks({name:"apocalypso - mr flash"}, function(err, res){console.log(err || res.items[0])})

// the following request gives no result, where as the artist exists on youtube
// http://developer.echonest.com/api/v4/song/search?api_key=THPZEU9N7TCVO7CAH&artist=Ma%C3%AEtre+Gims&title=Zombie&bucket=id:musicbrainz
// => {"response": {"status": {"version": "4.2", "code": 0, "message": "Success"}, "songs": []}}

exports.searchTracks = searchTracks;
