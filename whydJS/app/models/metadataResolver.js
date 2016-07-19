/**
 * metadataResolver API
 * extracts track metadata and mappings, using music APIs
 */

var snip = require("../snip.js");
var deezerApi = require("../models/deezer.js");
var TrackMatcher = require("../models/trackMatcher.js").TrackMatcher;

var worker = new snip.Worker({expiry:60000});

// source-specific metadata extractors => highly accurate artist name and title, or none
// each module must implement the fetchTrackMetadata() method
var EXTRACTORS = {
	en: require("../models/echonest.js"),
	yt: require("../models/youtube.js"),
	sc: require("../models/soundcloud.js"),
	sp: require("../models/spotify.js"),
	dz: require("../models/deezer.js"),
};

// TODO: implement metadata resolution for these sources:
var IGNORED_EXTRACTORS = {
	bc: true, // bancamp
	dm: true, // dailymotion
	vi: true, // vimeo
	ja: true, // jamendo
};

exports.EXTRACTORS = EXTRACTORS;

function parseEid(eId){
	var match = (""+eId).match("^/([a-z]+)/(.+)"); // => [1]: source id, [2]: source-based stream id
	return match && match.length == 3 && {
		sourceId: match[1],
		contentUri: match[2].split("#")[0]
	};
}

/*
	=== IDEAL VERSION ===

	define each service as a node that can transform typed inputs (ex: artist + title fields)
	into typed outputs (ex: deezer track id, isrc...)

	=> for each query, build a graph of services to invoke in order to result in expected
		outputs, based on provided inputs

	order of execution:
		- execute api based on structured metadata first
			- search in local database first (if applicable)
			- or search on echonest (if possible)
				- find deezer mapping for the first hit
					- fetch isrc from deezer api
				- or find another mapping
					...
			- or use another lookup service
				...
			- or process following track hits
				...
		- if no match, try a unstructured track search
			...
*/

/*
	--- COMMON METADATA STRUCTURE ---

	result = {
		params: {
			url: (string)
		},
		metadata: {
			artistName: (string) // extracted from track source page (e.g. youtube page)
			trackTitle: (string) //  ''
		}
		echonestHits: (int) // number of matches from echonest search query
	//	foreignIds: (object: {source->"id"}) // e.g. {deezer:"007", isrc:"POUET"}
		mappings: {
			ec: {id:"xx7z", c:0.8}, // echonest id with confidence
			is: {id:"xx7z", c:0.8}, // isrc with confidence
			sc: {id:"/author/track#uri", c:0.5}, // soundcloud ...
		}
		stack: [
			"en:0:4",	// used the 4th "release" track of first hit
			"dz"		// used deezer mapping to extract isrc
		]
	}
*/

// used to convert echonest's foreignIds to whyd's source IDs
var SOURCES = exports.SOURCES = {
	"echonest": "en",
	"spotify": "sp",
	"deezer": "dz",
	"isrc": "is",
	"youtube": "yt",
	"soundcloud": "sc",
//	"musicbrainz": "mb",
//	"discogs": "dc",
};

// TODO: run independent resolvers in parallel, and others as soon as the mappings they need are resolved

//var NB_BEST_MATCHES_TO_DISPLAY = 1;

function findBestMatches(trackMetadata, hits){
	if (!hits.length)
		return [];
	var matcher = TrackMatcher(trackMetadata);
	return (hits || []).map(function(hit, i){
		hit._d = matcher.evalConfidence(hit);
		hit.distance = hit._d.distance;
		hit.c = hit._d.confidence;
		return hit;
	}).sort(snip.makeFieldSort("distance", snip.ascSort));
}

function searchBestMatches(api, trackMetadata, cb){
	// TODO: change callback function signature
	api.searchTracks(trackMetadata, function(err, res){
		var hits = findBestMatches(trackMetadata, (res || {}).items || []);
//		for(var i in hits.slice(0, NB_BEST_MATCHES_TO_DISPLAY))
//			console.log((NB_BEST_MATCHES_TO_DISPLAY > 1 ? "#" + i + "\n" : "") + hits[i]._d.toString("    "));
		cb(err, hits);
	});
}

exports.searchBestMatches = searchBestMatches;

function appendMapping(track, sourceId, hit){
	if (hit.uri) {
		hit.id = hit.uri;
		delete hit.uri;
	}
	track.mappings[sourceId] = hit;
//	hit._d && console.log(hit._d.toString("    "));
}

function searchAndAppendMapping(sourceId, track, cb){
	if (track.mappings[sourceId])
		return cb(null, track, []);
	// TODO/question: should we use original track name or echonest's hit ?
	searchBestMatches(EXTRACTORS[sourceId], track.metadata, function(err, hits){
		var hit = hits[0];
		if (hit) {
			hit.c *= (track.metadata.confidence || 1);
			appendMapping(track, sourceId, hit);
		}
		cb(null, track, hits);
	});
}

function makeMappingSearcher(sourceId){
	return searchAndAppendMapping.bind(null, sourceId);
}

var MAPPING_RESOLVERS = [
//	[service name, lookup function that appends mappings with confidence],
	["->en->en,dz,sp", function(track, cb){
		searchAndAppendMapping("en", track, function(err, track, hits){
			track.echonestHits = hits.length;
			if (!hits.length)
				return cb(null, track);
			var bestHit = hits[0];
			for (var source in bestHit.foreignIds){
				if (SOURCES[source])
					appendMapping(track, SOURCES[source], {
						id: bestHit.foreignIds[source].split(":").pop(),
						c: bestHit.c,
					});
				else
					console.log("warning: unrecognized foreign id:", source);
			}
			cb(null, track);
		});
	}],
	["->dz->dz", makeMappingSearcher("dz")],
	["dz->dz->is", function(track, cb){
		var dzMapping = track.mappings["dz"];
		if (track.mappings["is"] || !dzMapping)
			return cb(null, track);
		// TODO: add case where dzMapping was not found by echonest
		deezerApi.fetchTrackInfo(dzMapping.id, function(dzTrack){
			var isrc = (dzTrack || {}).isrc;
			if (isrc)
				appendMapping(track, "is", {
					id: isrc,
					c: dzMapping.c,
				});
			cb(null, track);
		});
	}],
	["->sc->sc", makeMappingSearcher("sc")],
	["->yt->yt", makeMappingSearcher("yt")],
	// TODO: add spotify resolver
	// TODO: add isrc resolver?
];

// takes trackMetadata (artistName, trackTitle, etc...)
// => returns mapping for expectedSourceId only
exports.getTrackMapping = function(expectedSourceId, trackMetadata, cb){
	for(var i in MAPPING_RESOLVERS){
		var resolver = MAPPING_RESOLVERS[i];
		var dests = resolver[0].split("->").pop();
		if (dests.indexOf(expectedSourceId) != -1)
			return resolver[1]({metadata:trackMetadata, mappings:{}}, function(err, track){
				cb(err, ((track || {}).mappings || {})[expectedSourceId]);
			});
	}
	cb();
}

// takes track.metadata (artistName, trackTitle, etc...) and optionally track.params.eId
// => populates track.mappings
function appendTrackMappings(track, cb){
	track.mappings = track.mappings || {};
	if (track.params && track.params.eId) {
		var match = parseEid(track.params.eId);
		if (!match) throw new Error("invalid eId");
		appendMapping(track, match.sourceId, {
			id: match.contentUri,
			c: 1,
		});
	}
	if (!track.metadata.hasOwnProperty("confidence"))
		track.metadata.confidence = 1;
	// fetch other mappings, based on resolvers
	var resolvers = MAPPING_RESOLVERS.slice();
	(function nextResolver(err){
		var resolver = resolvers.shift();
		if (!resolver || err)
			return cb(err, track);
		var resolverName = resolver[0], resolverFct = resolver[1];
//		console.log(" -> trying", resolverName, "resolver...");
		resolverFct(track, nextResolver);
	})();
}

// given the eId of a track -> returns a track object with metadata and mappings fields.
// called whenever a track is posted on whyd => saved in the track collection in db.
exports.fetchMetadataForEid = function(eId, callback){
	var cb = worker.newJob("fetchMetadataForEid:"+eId).wrapCallback(callback);
	var match = parseEid(eId);
	if (!match) return cb(new Error("invalid eId"));
	var api = EXTRACTORS[match.sourceId];
	var track = {
		params: { eId: eId },
		metadata: {},
		mappings: {},
	};
	if (!api || !api.fetchTrackMetadata) {
		console.log("unknown source id: " + match.sourceId);
		if (IGNORED_EXTRACTORS[match.sourceId])
			return cb(null, track);
		else
			return cb(new Error("unknown source id: " + match.sourceId));
	}
	api.fetchTrackMetadata(match.contentUri, function(err, metadata){
		track.metadata = metadata;
		if (err || !metadata || (!metadata.name && !metadata.trackTitle))
			return cb(err, track);
		appendTrackMappings(track, cb);
	});
}
