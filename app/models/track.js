/**
 * track model
 * - maintained by post model: updateByEid()
 * - read by hot tracks controller: getHotTracks()
 * - read by notif template: getHotTracks()
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
  -> the prevRank is never updated => no movement information will be displayed on openwhyd.org/hot
  -> the score of a track will only be updated on a (re-)post, like, or play operation on that track
*/

var mongodb = require('./mongodb.js');
var ObjectId = mongodb.ObjectId;
var snip = require('../snip.js');
var metadataResolver = require('../models/metadataResolver.js');
const feature = require('../features/hot-tracks.js');

const { FIELDS_TO_SUM, FIELDS_TO_COPY } = feature;

var COEF_REPOST = 100;
var COEF_LIKE = 50;
var COEF_PLAY = 1;

var HOT_TRACK_TIME_WINDOW = 7 * 24 * 60 * 60 * 1000; // count (re)posts that are less than 1 week old, for ranking

function scorePost(post) {
  return COEF_REPOST * post.nbR + COEF_LIKE * post.nbL + COEF_PLAY * post.nbP;
}

var POST_FETCH_OPTIONS = {
  limit: 10000,
  sort: [['_id', 'desc']],
};

// core methods

function save(track, cb, replace) {
  var op = replace ? track : { $set: track };
  mongodb.collections['track'].updateOne(
    { eId: track.eId },
    op, // TODO: always use $set operator, to prevent "Update document requires atomic operators" ? (see https://github.com/openwhyd/openwhyd/issues/441#issuecomment-774697717)
    { upsert: true },
    function (error, result) {
      //console.log("=> saved hot track:", result);
      if (error) console.error('track.save() db error:', error);
      if (cb) cb(result);
    }
  );
}

function remove(q, cb) {
  mongodb.collections['track'].deleteOne(q, function (error, result) {
    console.log('=> removed hot track:', q);
    if (error) console.error('track.remove() error: ' + error.stack);
    if (cb) cb(result);
  });
}

exports.countTracksWithField = function (fieldName, cb) {
  var q = {};
  q[fieldName] = { $exists: 1 };
  mongodb.collections['track'].countDocuments(q, cb);
};

/* fetch top hot tracks, without processing */
exports.fetch = function (params, handler) {
  params = params || {};
  params.sort = params.sort || [['score', 'desc']];
  mongodb.collections['track'].find({}, params, function (err, cursor) {
    cursor.toArray(function (err, results) {
      // console.log('=> fetched ' + results.length + ' tracks');
      if (handler) handler(results);
    });
  });
};

exports.fetchTrackByEid = function (eId, cb) {
  // in order to allow requests of soundcloud eId without hash (#):
  var eidPrefix = ('' + eId).indexOf('/sc/') == 0 && ('' + eId).split('#')[0];
  mongodb.collections['track'].findOne({ eId: eId }, function (err, track) {
    if (!err && !track && eidPrefix)
      mongodb.collections['track'].findOne(
        { eId: new RegExp('^' + eidPrefix + '.*') },
        function (err, track) {
          if (track && track.eId.split('#')[0] != eidPrefix) track = null;
          cb(err ? { error: err } : track);
        }
      );
    else cb(err ? { error: err } : track);
  });
};

// functions for fetching tracks and corresponding posts

function fetchPostsByPid(pId) {
  var pidList = (pId && Array.isArray(pId) ? pId : []).map(function (id) {
    return ObjectId('' + id);
  });
  //for (let i in pidList) pidList[i] = ObjectId("" + pidList[i]);
  return new Promise((resolve, reject) =>
    mongodb.collections['post'].find(
      { _id: { $in: pidList } },
      POST_FETCH_OPTIONS,
      (err, cursor) =>
        err
          ? reject(err)
          : cursor.toArray((err, posts) => (err ? reject(err) : resolve(posts)))
    )
  );
}

/* fetch top hot tracks, and include complete post data (from the "post" collection), score, and rank increment */
exports.getHotTracks = function (params, handler) {
  params = params || {};
  params.skip = parseInt(params.skip || 0);
  const getTracksByDescendingScore = () =>
    new Promise((resolve) => {
      exports.fetch(params, resolve);
    });
  feature
    .getHotTracks(getTracksByDescendingScore, fetchPostsByPid)
    .then(({ tracks, postsByEid }) => {
      handler(tracks, { postsByEid });
    });
};

// update function

function fetchPostsByEid(eId, cb) {
  var criteria = { eId: eId && Array.isArray(eId) ? { $in: eId } : eId };
  mongodb.collections['post'].find(
    criteria,
    POST_FETCH_OPTIONS,
    function (err, cursor) {
      cursor.toArray(function (err, posts) {
        cb(posts);
      });
    }
  );
}

// called when a track is updated/deleted by a user
exports.updateByEid = function (eId, cb, replace, additionalFields) {
  var since = Date.now() - HOT_TRACK_TIME_WINDOW;
  console.log('track.updateByEid: ', eId);
  fetchPostsByEid(eId, function (posts) {
    if (!posts || !posts.length) return remove({ eId: eId }, cb);
    // 0) init track objects (one for storage and display, one for scoring over the selected period of time)
    var freshTrackStats = {},
      track = {
        eId: eId,
        nbR: posts.length,
      };
    for (let f in FIELDS_TO_SUM) {
      track[f] = track[f] || 0;
      freshTrackStats[f] = freshTrackStats[f] || 0;
    }
    // 1) score posts, to select which user will be featured for this track
    for (let p in posts) {
      posts[p].nbL = (posts[p].lov || []).length;
      for (let f in FIELDS_TO_SUM) posts[p][f] = posts[p][f] || 0;
      posts[p].score = scorePost(posts[p]);
      track.nbP += posts[p].nbP;
      track.nbL += posts[p].nbL;
      if (
        posts[p]._id.getTimestamp().getTime() > since &&
        posts[p].ctx != 'hot'
      ) {
        ++freshTrackStats.nbR;
      }
    }
    posts.sort(function (a, b) {
      return b.score - a.score;
    });
    // 2) populate and save track object, based on best-scored post
    track.pId = posts[0]._id;
    for (let f in FIELDS_TO_COPY) track[f] = posts[0][f];
    track.score = scorePost(freshTrackStats);
    if (additionalFields) {
      console.log(
        'storing additional fields',
        Object.keys(additionalFields),
        '...'
      );
      for (let f in additionalFields) track[f] = additionalFields[f];
    }
    console.log('saving track', track);
    save(track, cb, replace);
  });
};

var CONCISE_META_FIELDS = {
  trackTitle: 'tit',
  artistName: 'art',
  duration: 'dur',
  confidence: 'c',
};

var MINIMUM_CONFIDENCE = 0.8;

function translateTrackToConciseMetadata(track = {}) {
  var concise = {};
  var meta = track.metadata || {};
  var trackId = meta.uri || meta.id;
  if (
    /*meta.trackTitle && meta.artistName &&*/ meta.confidence >=
    MINIMUM_CONFIDENCE
  ) {
    concise.meta = snip.filterFields(meta, CONCISE_META_FIELDS);
  }
  if (typeof track.mappings == 'object') {
    concise.alt = [];
    for (let sourceId in track.mappings) {
      var alt = track.mappings[sourceId];
      if (alt.id != trackId && alt.c >= MINIMUM_CONFIDENCE)
        concise.alt.push('/' + sourceId + '/' + (alt.uri || alt.id));
    }
  }
  return concise;
}

// translates resulting metadata and mappings from metadataResolver,
// to whyd's track collection format (concise fields)
exports.fetchConciseMetadataForEid = function (eId, cb) {
  metadataResolver.fetchMetadataForEid(eId, function (err, track) {
    //console.log("fetchMetadataForEid =>", track);
    cb(err ? { error: '' + err } : translateTrackToConciseMetadata(track));
  });
};

// maintenance functions

exports.snapshotTrackScores = function (cb) {
  mongodb.collections['track'].countDocuments(function (err, count) {
    var i = 0;
    mongodb.forEach2(
      'track',
      { fields: { score: 1 } },
      function (track, next, closeCursor) {
        if (!track || track.error) {
          cb();
          closeCursor();
        } else {
          if (count < 1000) {
            console.log(`snapshotTrackScores ${i + 1} / ${count}`);
          } else if (count % 1000 === 0) {
            console.log(
              `snapshotTrackScores ${i / 1000}k / ${Math.floor(count / 1000)}k`
            );
          }
          ++i;
          mongodb.collections['track'].updateOne(
            { _id: track._id },
            { $set: { prev: track.score } },
            next
          );
        }
      }
    );
  });
};

exports.refreshTrackCollection = function (cb) {
  mongodb.collections['track'].countDocuments(function (err, count) {
    var i = 0;
    mongodb.forEach2(
      'track',
      { fields: { _id: 0, eId: 1 } },
      function (track, next, closeCursor) {
        if (!track || track.error) {
          cb();
          closeCursor();
        } else {
          console.log('refreshHotTracksCache', ++i, '/', count);
          exports.updateByEid(track.eId, next, true);
        }
      }
    );
  });
};

exports.model = exports;
