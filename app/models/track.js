// @ts-check

/**
 * track model
 * - maintained by post model: updateByEid()
 * - read by hot tracks controller: getHotTracksFromDb()
 * - read by notif template: getHotTracksFromDb()
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

const config = require('./config.js');
const mongodb = require('./mongodb.js');
const ObjectId = mongodb.ObjectId;
const feature = require('../features/hot-tracks.js');

const { FIELDS_TO_SUM, FIELDS_TO_COPY } = feature;

const COEF_REPOST = 100;
const COEF_LIKE = 50;
const COEF_PLAY = 1;

const HOT_TRACK_TIME_WINDOW = 7 * 24 * 60 * 60 * 1000; // count (re)posts that are less than 1 week old, for ranking

function scorePost(post) {
  return COEF_REPOST * post.nbR + COEF_LIKE * post.nbL + COEF_PLAY * post.nbP;
}

const POST_FETCH_OPTIONS = {
  limit: 10000,
  sort: ['_id', 'desc'],
};

// core methods

function save(track, cb, replace) {
  const op = replace ? track : { $set: track };
  mongodb.collections['track']
    .updateOne(
      { eId: track.eId },
      op, // TODO: always use $set operator, to prevent "Update document requires atomic operators" ? (see https://github.com/openwhyd/openwhyd/issues/441#issuecomment-774697717)
      { upsert: true },
    )
    .then(cb, (error) => console.trace('track.save() db error:', error));
}

/** Delete a "hot track". */
function remove(q, cb) {
  mongodb.collections['track']
    .deleteOne(q)
    .then(cb, (error) => console.trace('track.remove() error:', error));
}

exports.countTracksWithField = function (fieldName, cb) {
  const q = {};
  q[fieldName] = { $exists: 1 };
  mongodb.collections['track'].countDocuments(q).then(
    (res) => cb(null, res),
    (err) => cb(err),
  );
};

/* fetch top hot tracks, without processing */
exports.fetch = function (params, handler) {
  params = params || {};
  params.sort = params.sort || [['score', 'desc']];
  mongodb.collections['track']
    .find({ eId: { $ne: '/sc/undefined' } }, params) // exclude invalid eId values, cf https://github.com/openwhyd/openwhyd/issues/718#issuecomment-1710359006
    .toArray()
    .then(
      function (results) {
        // console.log('=> fetched ' + results.length + ' tracks');
        if (handler) handler(results);
      },
      (err) => {
        console.trace('trackModel.fetch', err);
        handler();
      },
    );
};

exports.fetchTrackByEid = function (eId, cb) {
  // in order to allow requests of soundcloud eId without hash (#):
  const eidPrefix = ('' + eId).indexOf('/sc/') == 0 && ('' + eId).split('#')[0];
  mongodb.collections['track'].findOne({ eId: eId }).then(
    function (track) {
      if (!track && eidPrefix)
        mongodb.collections['track']
          .findOne({ eId: new RegExp('^' + eidPrefix + '.*') })
          .then(
            (track) => {
              if (track && track.eId.split('#')[0] != eidPrefix) track = null;
              cb(track);
            },
            (err) => cb(err ? { error: err } : track),
          );
      else cb(track);
    },
    (err) => cb({ error: err }),
  );
};

// functions for fetching tracks and corresponding posts

const makeObjectIdList = (pId) =>
  (pId && Array.isArray(pId) ? pId : []).map(function (id) {
    return ObjectId('' + id);
  });

function fetchPostsByPid(pId) {
  return mongodb.collections['post']
    .find({ _id: { $in: makeObjectIdList(pId) } }, POST_FETCH_OPTIONS)
    .toArray();
}

/* fetch top hot tracks, and include complete post data (from the "post" collection), score, and rank increment */
exports.getHotTracksFromDb = function (params, handler) {
  params.skip = parseInt(params.skip || 0);
  const getTracksByDescendingScore = () =>
    new Promise((resolve) => {
      exports.fetch(params, resolve);
    });
  feature
    .getHotTracks(getTracksByDescendingScore, fetchPostsByPid)
    .then((tracks) =>
      tracks.map((track) => ({
        ...track,
        trackUrl: config.translateEidToUrl(track.eId),
      })),
    )
    .then((tracks) => {
      handler(tracks);
    });
};

// update function

function fetchPostsByEid(eId, cb) {
  const criteria = { eId: eId && Array.isArray(eId) ? { $in: eId } : eId };
  mongodb.collections['post']
    .find(criteria, POST_FETCH_OPTIONS)
    .toArray()
    .then(
      (posts) => cb(posts),
      (err) => {
        console.trace('fetchPostsByEid', err);
        cb();
      },
    );
}

// called when a track is updated/deleted by a user
exports.updateByEid = function (eId, cb, replace, additionalFields) {
  if (!eId) throw new Error('eId is not defined');
  const since = Date.now() - HOT_TRACK_TIME_WINDOW;
  console.log('track.updateByEid: ', eId);
  fetchPostsByEid(eId, function (posts) {
    if (!posts || !posts.length) return remove({ eId: eId }, cb);
    // 0) init track objects (one for storage and display, one for scoring over the selected period of time)
    const freshTrackStats = {},
      track = {
        eId: eId,
        nbR: posts.length,
      };
    for (const f in FIELDS_TO_SUM) {
      track[f] = track[f] || 0;
      freshTrackStats[f] = freshTrackStats[f] || 0;
    }
    // 1) score posts, to select which user will be featured for this track
    for (const p in posts) {
      posts[p].nbL = (posts[p].lov || []).length;
      for (const f in FIELDS_TO_SUM) posts[p][f] = posts[p][f] || 0;
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
    for (const f in FIELDS_TO_COPY) track[f] = posts[0][f];
    track.score = scorePost(freshTrackStats);
    if (additionalFields) {
      console.log(
        'storing additional fields',
        Object.keys(additionalFields),
        '...',
      );
      for (const f in additionalFields) track[f] = additionalFields[f];
    }
    save(track, cb, replace);
  });
};

// maintenance functions

exports.snapshotTrackScores = async function (cb) {
  const count = await mongodb.collections['track'].countDocuments();
  let i = 0;
  mongodb.forEach2(
    'track',
    { fields: { score: 1 } },
    async function (track, next, closeCursor) {
      if (!track || track.error) {
        cb();
        closeCursor();
      } else {
        if (count < 1000) {
          console.log(`snapshotTrackScores ${i + 1} / ${count}`);
        } else if (count % 1000 === 0) {
          console.log(
            `snapshotTrackScores ${i / 1000}k / ${Math.floor(count / 1000)}k`,
          );
        }
        ++i;
        await mongodb.collections['track'].updateOne(
          { _id: track._id },
          { $set: { prev: track.score } },
        );
        next();
      }
    },
  );
};

exports.refreshTrackCollection = async function (cb) {
  const count = await mongodb.collections['track'].countDocuments();
  let i = 0;
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
    },
  );
};

exports.model = exports;
