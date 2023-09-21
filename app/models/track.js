// @ts-check

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
