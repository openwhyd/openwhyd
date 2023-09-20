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
const feature = require('../features/hot-tracks.js');

const HOT_TRACK_TIME_WINDOW = 7 * 24 * 60 * 60 * 1000; // count (re)posts that are less than 1 week old, for ranking

// functions for fetching hot tracks

/**
 * @param {object} params
 * @param {number | undefined} params.limit
 * @param {number | undefined} params.skip
 * @param {mongodb.ObjectId | undefined} params.sinceId
 */
async function getRecentPostsByDescendingNumberOfReposts(params) {
  const sinceId =
    params.sinceId ??
    mongodb.ObjectId(
      mongodb.dateToHexObjectId(
        new Date(new Date().getTime() - HOT_TRACK_TIME_WINDOW),
      ),
    );
  return (
    await mongodb.collections['post']
      .aggregate([
        {
          $match: {
            _id: { $gte: sinceId },
            eId: { $ne: '/sc/undefined' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $addFields: {
            nbLoves: {
              $cond: {
                if: { $isArray: '$lov' },
                then: { $size: '$lov' },
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: '$eId',
            pId: { $first: '$_id' },
            name: { $first: '$name' },
            img: { $first: '$img' },
            uId: { $first: '$uId' },
            uNm: { $first: '$uNm' },
            pl: { $first: '$pl' },
            nbLoves: { $sum: '$nbLoves' },
            nbReposts: { $sum: '$nbR' },
            posts: { $push: '$_id' },
          },
        },
        { $addFields: { nbPosts: { $size: '$posts' } } },
        {
          $addFields: {
            score: { $sum: ['$nbPosts', '$nbReposts', '$nbLoves'] },
          },
        },
        { $sort: { score: -1 } },
        { $skip: params?.skip ?? 0 },
        { $limit: params.limit },
      ])
      .toArray()
  ).map((result) => ({
    _id: result.posts[0],
    eId: result._id,
    name: result.name,
    img: result.img,
    uId: result.uId,
    uNm: result.uNm,
    pl: result.pl,
    pId: result.pId,
    nbR: result.nbPosts + result.nbReposts,
    nbL: result.nbLoves,
    score: result.score,
  }));
}

/** Fetch top/hot tracks, and include complete post data (from the "post" collection), score, and rank increment. */
exports.getHotTracksFromDb = function (params, handler) {
  params.skip = parseInt(params.skip || 0);
  params.sinceId = params.sinceId
    ? mongodb.ObjectId(params.sinceId)
    : undefined;
  feature
    .getHotTracks(() => getRecentPostsByDescendingNumberOfReposts(params))
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

exports.model = exports;
