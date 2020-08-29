var assert = require('assert');
var querystring = require('querystring');
var snip = require('../snip.js');
var trackMatcher = require('../models/trackMatcher.js');

// add fifo queue for api calls to deezer
snip.httpSetDomain(/api\.deezer\.com/, { queue: [] });

exports.translateTrack = function (track) {
  var translated = {
    id: track.id,
    trackTitle: track.title,
    artistName: track.artist.name,
    albumTitle: track.album.title,
    //	albumYear: track.album.release_date.substr(0, 4),
    isrc: track.isrc,
    duration: track.duration,
    //bpm: track.bpm,
  };
  //if (translated.albumYear == "0000")
  //	delete translated.albumYear;
  return translated;
};

function queryDeezer(p, cb) {
  p = p || {};
  var url = 'http://api.deezer.com/search?' + querystring.stringify(p);
  //console.log("Deezer query:", url);
  return snip.httpRequestJSON(url, null, cb);
}

function translateOutgoingQueryParams(trackMetadata) {
  return { q: trackMetadata.q || trackMatcher.getTrackTitle(trackMetadata) };
}

function searchTracks(p, cb, raw) {
  queryDeezer(translateOutgoingQueryParams(p), function (err, res) {
    if (err || raw) cb(err, res);
    else {
      res = res || {};
      if (res.data)
        cb(null, {
          items: res.data.map(exports.translateTrack),
        });
      else {
        console.error('invalid response from deezer.searchTracks:', res);
        cb(new Error('invalid response from deezer.searchTracks'));
      }
    }
  });
}

function fetchTrackInfo(trackId, cb) {
  return snip.httpRequestJSON(
    'http://api.deezer.com/track/' + encodeURIComponent(trackId),
    null,
    function (err, res) {
      cb(err ? { error: err } : res);
    }
  );
}

exports.fetchTrackMetadata = function (_trackId, cb, raw) {
  const trackId = ('' + _trackId).split(/[:/]/).pop();
  assert.ok(trackId, 'trackId is null');
  return snip.httpRequestJSON(
    'http://api.deezer.com/track/' + encodeURIComponent(trackId),
    null,
    function (err, res) {
      if (err || raw) cb(err, res);
      else cb(null, exports.translateTrack(res));
    }
  );
};

/*
var METADATA_MAPPING = {
	"art": "artistName",
	"tit": "trackTitle"
};

exports.getDeezerId = function(p, cb){
	console.log("getting deezer track id", p.eId);
	function returnMetaOr(orCb){
		return function(tr) {
			var meta = tr.meta || {};
			if (meta.dz) {
				console.log("found dz meta");
				cb(tr);
			}
			else if (meta.art && meta.tit) {
				var q = snip.filterFields(meta, METADATA_MAPPING);
				console.log("querying dz...", q);
				deezerApi.searchTracks(q, function(dzRes){
					console.log("dz response => dzRes");
					tr.dzRes = dzRes;
					cb(tr);
				});
			}
			else if (orCb)
				orCb(tr);
			else
				cb(tr);
		};
	}
	trackModel.fetchTrackByEid(p.eId, returnMetaOr(function(tr){
		console.log("missing metadata => update metadata...");
		trackModel.updateAndPopulateMetadata(p.eId, returnMetaOr(), true);
	}));
},
*/
// searchTracks({trackTitle:"the monster", artistName:"eminem"}, console.log); // =>
// fetchTrackInfo(17782324, console.log);

exports.searchTracks = searchTracks;
exports.fetchTrackInfo = fetchTrackInfo;
