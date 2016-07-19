/**
 * track model
 * - maintained by post model: updateByEid()
 * - read by hot tracks controller: fetchPostsByGenre(), fetchPostsBySubscription()
 * - read by genre page controller: fetchPostsByGenre()
 * - read by notif template: fetchPostsByGenre()
 * @author adrienjoly, whyd
 **/

 /*
  - - - structure of a track record - - -
  _id: automatically-assigned identifier (ObjectId)
  eId: uri used to identify and embed this track's stream from its source
  img: url of the image thumb of that track
  name: name of the track (combines artist and title) // TODO: which version is stored in case of conflict?
  score: the higher this number, the higher this track will rank in the hot tracks. computed from various metrics.
  nbR: number of posts/reposts within the HOT_TRACK_TIME_WINDOW period
  nbL: number of likes
  nbP: number of plays
  prev: score value at last snapshot (used to compute trends)
  meta: {art, tit, dur, c, t}: concise metadata extracted from 3rd-parties (artist name, track title, duration, confidence 0<1, timestamp)
  alt: [eId1, eId2...]: array of alternative souces for that track (cross-platform mappings)

  - - - old fields - - -
  prevRank: used to store the rank/index of that record in the track collection, before the score was updated
  nbFreshPosts: used to store the number of posts within the HOT_TRACK_TIME_WINDOW
  nbTotalPosts: duplicate of nbR
  nbTotalLikes: duplicate of nbL
  nbTotalPlays: duplicate of nbP

  - - - notice - - -
  since the periodic call of refreshHotTracksCache() was removed:
  -> the prevRank is never updated => no movement information will be displayed on whyd.com/hot
  -> the score of a track will only be updated on a (re-)post, like, or play operation on that track
*/

var config = require("./config.js");
var mongodb = require("./mongodb.js");
var ObjectId = mongodb.ObjectId;
var snip = require("../snip.js");
var plTagsModel = require("./plTags.js");
var postModel = require("./post.js");
var metadataResolver = require("../models/metadataResolver.js");

var FIELDS_TO_SUM = {
	nbP: true, // number of plays
	nbL: true, // number of likes (from lov[] field)
	nbR: true, // number of posts/reposts
};

var FIELDS_TO_COPY = {
	name: true,
	img: true,
	score: true,
};

var COEF_REPOST = 100;
var COEF_LIKE = 50;
var COEF_PLAY = 1;

var HOT_TRACK_TIME_WINDOW = 7 * 24 * 60 * 60 * 1000; // count (re)posts that are less than 1 week old, for ranking

function scorePost(post) {
	return COEF_REPOST * post.nbR + COEF_LIKE * post.nbL + COEF_PLAY * post.nbP;
}

var POST_FETCH_OPTIONS = {
	limit: 10000,
	sort: [['_id','desc']]
};

// core methods

function save(track, cb, replace) {
	var op = replace ? track : {$set:track};
	mongodb.collections["track"].update({eId:track.eId}, op, {upsert:true}, function(error, result) {
		//console.log("=> saved hot track:", result);
		if (error)
			console.error("track.save() db error:", error);
		if (cb)
			cb(result);
	});
}

function remove(q, cb) {
	mongodb.collections["track"].remove(q, function(error, result) {
		console.log("=> removed hot track:", result);
		if (error)
			console.error("track.remove() error: " + error.stack);
		if (cb)
			cb(result);
	});
}

exports.countTracksWithField = function(fieldName, cb){
	var q = {};
	q[fieldName] = { $exists: 1 };
	mongodb.collections["track"].count(q, cb);
}

/* fetch top hot tracks, without processing */
exports.fetch = function (params, handler) {
	params = params || {};
	params.sort = params.sort || [['score','desc']];
	mongodb.collections["track"].find({}, params, function(err, cursor) {
		cursor.toArray(function(err, results) {
			console.log("=> fetched " + results.length + " tracks");
			if (handler)
				handler(results);
		});
	});
};

exports.fetchTrackByEid = function(eId, cb){
	// in order to allow requests of soundcloud eId without hash (#):
	var eidPrefix = (""+eId).indexOf("/sc/") == 0 && (""+eId).split("#")[0];
	mongodb.collections["track"].findOne({eId:eId}, function(err, track){
		if (!err && !track && eidPrefix)
			mongodb.collections["track"].findOne({eId: new RegExp("^" + eidPrefix + ".*")}, function(err, track){
				if (track && track.eId.split("#")[0] != eidPrefix)
					track = null;
				cb(err ? {error:err} : track);
			});
		else
			cb(err ? {error:err} : track);
	});
};

// functions for fetching tracks and corresponding posts

var fieldList = Object.keys(FIELDS_TO_COPY)
	.concat(Object.keys(FIELDS_TO_SUM))
	.concat(["prev"]);

function mergePostData(track, post, offset) {
	for (var f in fieldList)
		post[fieldList[f]] = track[fieldList[f]];
	post.trackId = track._id;
	post.rankIncr = track.prev - track.score;
	return post;
}

function fetchPostsByPid(pId, cb) {
	var pidList = (pId && Array.isArray(pId) ? pId : []).map(function(id){ return ObjectId("" + id)});
	//for (var i in pidList) pidList[i] = ObjectId("" + pidList[i]);
	mongodb.collections["post"].find({_id: {$in: pidList}}, POST_FETCH_OPTIONS, function(err,cursor){
		cursor.toArray(function(err,posts){
			cb(posts);
		});
	});
}

/* fetch top hot tracks, and include complete post data (from the "post" collection), score, and rank increment */
exports.fetchPosts = function (params, handler) {
	params = params || {};
	var firstIndex = parseInt(params.skip || 0);
	exports.fetch(params, function(tracks){
		var pidList = snip.objArrayToValueArray(tracks, "pId");
		fetchPostsByPid(pidList, function(posts) {
			var postsByEid = snip.objArrayToSet(posts, "eId");
			for (var i in tracks) {
				var track = tracks[i];
				if (!track) {
					console.error("warning: skipping null track in track.fetchPosts()");
					continue;
				}
				var post = postsByEid[tracks[i].eId];
				if (!post) {
					//console.error("warning: skipping null post in track.fetchPosts()");
					continue;
				}
				tracks[i] = mergePostData(track, post, firstIndex + parseInt(i));
			}
			handler(tracks, {postsByEid:postsByEid});
		});
	});
};

exports.fetchPostsByGenres = function (genres, p, cb) {
	if (!genres || !genres.length)
		return exports.fetchPosts(p, cb);
	var genreSet = snip.arrayToSet(genres);
	var posts = [];
	var toSkip = parseInt(p.skip || 0); // TODO: find a more optimal solution (less db queries)
	plTagsModel.getTagEngine(function(tagEngine){
		mongodb.forEach2("track", {sort: [['score','desc']]}, function(track, next) {
			if (!next || posts.length >= p.limit)
				cb(posts);
			else {
				var tags = tagEngine.getTagsByEid((track || {}).eId || "");
				if (tags && tags.length && genreSet[tags[0].id]) {
					postModel.fetchPostById(track.pId, function(post){
						if (post && --toSkip < 0){
							posts.push(mergePostData(track, post));
						}
						next();
					});
				}
				else
					next();
			}
		});
	});
};

exports.fetchPostsByGenre = function (genre, p, cb) {
	if (!genre)
		exports.fetchPosts(p, cb);
	else
		exports.fetchPostsByGenres([genre], p, cb);
}

exports.fetchPostsFromSubscriptions = function (uidList, p, cb) {
	var posts = [];
	if (!uidList || !uidList.length)
		return cb(posts);
	var toSkip = parseInt(p.skip || 0); // TODO: find a more optimal solution (less db queries)
	var ranking = 0;
	plTagsModel.getTagEngine(function(tagEngine){
		mongodb.forEach2("track", {sort: [['score','desc']]}, function(track, next) {
			++ranking;
			if (!next || posts.length >= p.limit)
				cb(posts);
			else {
				var query = {
					eId: track.eId,
					uId: {"$in":uidList},
					"repost.uId": {"$nin":uidList}
				};
				postModel.fetchPosts(query, {}, {}, function(postArray){
					if (postArray && postArray.length && --toSkip < 0) {
						var post = mergePostData(track, postArray[0]);
						post.tags = tagEngine.getTagsByEid((track || {}).eId || "");
						post.rank = ranking;
						posts.push(post);
					}
					next();
				});
			}
		});
	});
};

// update function

function fetchPostsByEid(eId, cb) {
	var criteria = {eId: eId && Array.isArray(eId) ? {$in:eId} : eId}
	mongodb.collections["post"].find(criteria, POST_FETCH_OPTIONS, function(err,cursor){
		cursor.toArray(function(err,posts){
			cb(posts);
		});
	});
}

// called when a track is updated/deleted by a user,
// or called by updateAndPopulateMetadata() when a track is posted by a user
exports.updateByEid = function (eId, cb, replace, additionalFields) {
	var since = Date.now() - HOT_TRACK_TIME_WINDOW;
	console.log("track.updateByEid: ", eId);
	fetchPostsByEid(eId, function(posts){
		if (!posts || !posts.length)
			return remove({eId: eId}, cb);
		// 0) init track objects (one for storage and display, one for scoring over the selected period of time)
		var freshTrackStats = {}, track = {
			eId: eId,
			nbR: posts.length,
		};
		for (var f in FIELDS_TO_SUM) {
			track[f] = track[f] || 0;
			freshTrackStats[f] = freshTrackStats[f] || 0;
		}
		// 1) score posts, to select which user will be featured for this track
		for (var p in posts) {
			posts[p].nbL = (posts[p].lov || []).length;
			for (var f in FIELDS_TO_SUM)
				posts[p][f] = posts[p][f] || 0;
			posts[p].score = scorePost(posts[p]);
			track.nbP += posts[p].nbP;
			track.nbL += posts[p].nbL;
			if (posts[p]._id.getTimestamp().getTime() > since && posts[p].ctx != "hot") {
				++freshTrackStats.nbR;
			}
		}
		posts.sort(function(a,b){
			return b.score - a.score;
		});
		// 2) populate and save track object, based on best-scored post
		track.pId = posts[0]._id;
		for (var f in FIELDS_TO_COPY)
			track[f] = posts[0][f];
		track.score = scorePost(freshTrackStats);
		if (additionalFields){
			console.log("storing additional fields", Object.keys(additionalFields), "...");
			for (var f in additionalFields)
				track[f] = additionalFields[f];
		}
		console.log("saving track", track);
		save(track, cb, replace);
	});
}

var CONCISE_META_FIELDS = {
	trackTitle: "tit",
	artistName: "art",
	duration: "dur",
	confidence: "c",
};

var MINIMUM_CONFIDENCE = 0.8;

function translateTrackToConciseMetadata(track){
	var concise = {};
	var track = track || {};
	var meta = track.metadata || {};
	var trackId = meta.uri || meta.id;
	if (/*meta.trackTitle && meta.artistName &&*/ meta.confidence >= MINIMUM_CONFIDENCE) {
		concise.meta = snip.filterFields(meta, CONCISE_META_FIELDS);
	}
	if (typeof track.mappings == "object") {
		concise.alt = [];
		for (var sourceId in track.mappings) {
			var alt = track.mappings[sourceId];
			if (alt.id != trackId && alt.c >= MINIMUM_CONFIDENCE)
				concise.alt.push("/" + sourceId + "/" + (alt.uri || alt.id));
		}
	}
	return concise;
}

// translates resulting metadata and mappings from metadataResolver,
// to whyd's track collection format (concise fields)
exports.fetchConciseMetadataForEid = function(eId, cb){
	metadataResolver.fetchMetadataForEid(eId, function(err, track){
		//console.log("fetchMetadataForEid =>", track);
		cb(err ? {error: ""+err} : translateTrackToConciseMetadata(track));
	});
}

function hasGoodMetadata(conciseTrack){
	var meta = (conciseTrack || {}).meta || {};
	return meta.tit && meta.art && meta.dur;
}

function hasAltMappings(conciseTrack){
	return ((conciseTrack || {}).alt || []).length;
}

function flattenObjectProperties(obj, path, res){
	var path = path || [];
	var res = res || {};
	for (var f in obj) {
		path.push(f);
		if (typeof obj[f] == "object" && !obj[f].splice)
			flattenObjectProperties(obj[f], path, res);
		else
			res[path.join(".")] = obj[f];
		path.pop();
	}
	return res;
}
// TEST: console.log("\n\n", flattenObjectProperties({a:{b:1,c:"coucou",d:[1,2,3]}}));

// called in place of updateByEid(), when a track is posted by a user
// populates meta{t,art,tit,c} and alternative source mapping/identifiers
exports.updateAndPopulateMetadata = function (eId, cb, force) {
	console.log("updateAndPopulateMetadata...", eId);
	exports.fetchTrackByEid(eId, function(track){
		if (!force && hasAltMappings(track) && hasGoodMetadata(track)) {
			console.log("good metadata and alternative mappings already found for this track => skipping metadata extraction");
			return exports.updateByEid(eId, cb, false);
		}
		exports.fetchConciseMetadataForEid(eId, function(finalMeta){
			finalMeta = finalMeta || {};
			//console.log("metadata result", finalMeta);
			if (finalMeta.error) {
				if (finalMeta.error.indexOf("404 - Not Found") == -1)
					console.error("updateAndPopulateMetadata", finalMeta.error || "null error in updateAndPopulateMetadata()");
				cb && cb(finalMeta);
				return;
			}
			if (finalMeta.meta) {
				var updates = flattenObjectProperties({meta: finalMeta.meta});
				delete finalMeta.meta;
				for (var key in updates)
					finalMeta[key] = updates[key];
			}
			if (!hasAltMappings(finalMeta))
				delete finalMeta.alt;
			// TODO: complete mappings, when possible
			if (Object.keys(finalMeta).length > 0) {
				finalMeta["meta.t"] = Date.now();
				exports.updateByEid(eId, cb, false, finalMeta);
			}
			else
				cb && cb(finalMeta);
		});
	});
}

// maintenance functions

exports.snapshotTrackScores = function(cb) {
	mongodb.collections["track"].count(function(err, count){
		var i = 0;
		mongodb.forEach2("track", {fields:{score:1}}, function (track, next){
			if (!track)
				cb();
			else {
				console.log("snapshotTrackScores", ++i, "/", count);
				mongodb.collections["track"].update({_id:track._id}, {$set:{prev:track.score}}, next);
			}
		});
	});
}

exports.refreshTrackCollection = function(cb) {
	mongodb.collections["track"].count(function(err, count){
		var i = 0;
		mongodb.forEach2("track", {fields:{_id:0,eId:1}}, function (track, next){
			if (!track)
				cb();
			else {
				console.log("refreshHotTracksCache", ++i, "/", count);
				exports.updateByEid(track.eId, next, true);
			}
		});
	});
}

exports.populateTrackMetadata = function(cb, force) {
	mongodb.collections["track"].count(function(err, count){
		var i = 0;
		mongodb.forEach2("track", {fields:{_id:0,eId:1,name:1}}, function (track, next){
			if (!track)
				cb();
			else {
				console.log("updateAndPopulateMetadata", ++i, "/", count, track.eId, track.name);
				exports.updateAndPopulateMetadata(track.eId, next, force);
			}
		});
	});
}

exports.model = exports;
