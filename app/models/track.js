// @ts-check

const config = require('./config.js');
const mongodb = require('./mongodb.js');
const feature = require('../features/hot-tracks.js');

const HOT_TRACK_TIME_WINDOW = 7 * 24 * 60 * 60 * 1000; // count (re)posts that are less than 1 week old, for ranking

const HOT_TRACKS_CACHE_TTL = 60 * 1000; // the ranking is expensive to compute, and doesn't need to be real-time
const HOT_TRACKS_PAGE_SIZE = 20; // the ranking is limited to one page of results, to bound its cost
const DEFAULT_CACHE_KEY = 'default';
const hotTracksCache = new Map(); // key => { expires: number, promise: Promise }

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

function fetchAndCacheHotTracks(params, cacheKey) {
  const promise = feature.getHotTracks(() =>
    getRecentPostsByDescendingNumberOfReposts({
      ...params,
      skip: 0,
      limit: HOT_TRACKS_PAGE_SIZE,
    }),
  );
  if (cacheKey) {
    hotTracksCache.set(cacheKey, {
      expires: Date.now() + HOT_TRACKS_CACHE_TTL,
      promise,
    });
    promise.catch(() => {
      // don't cache failures (but don't evict a newer entry either)
      if (hotTracksCache.get(cacheKey)?.promise === promise)
        hotTracksCache.delete(cacheKey);
    });
  }
  return promise;
}

function getCachedOrFetchHotTracks(params) {
  // cache (and share between concurrent requests) the ranking for the default time window
  const cacheKey = params.sinceId ? undefined : DEFAULT_CACHE_KEY;
  const cached = cacheKey ? hotTracksCache.get(cacheKey) : undefined;
  return cached && cached.expires > Date.now()
    ? cached.promise
    : fetchAndCacheHotTracks(params, cacheKey);
}

/**
 * Fetch top/hot tracks, and include complete post data (from the "post" collection), score, and rank increment.
 * Only the first page of the ranking (HOT_TRACKS_PAGE_SIZE tracks) is available: `skip` is ignored.
 */
exports.getHotTracksFromDb = function (params, handler) {
  const limit = Math.min(
    Number.parseInt(params.limit) || HOT_TRACKS_PAGE_SIZE,
    HOT_TRACKS_PAGE_SIZE,
  );
  const sinceId = params.sinceId ? mongodb.ObjectId(params.sinceId) : undefined;
  getCachedOrFetchHotTracks({ sinceId })
    .then((tracks) =>
      tracks.slice(0, limit).map((track) => ({
        ...track,
        trackUrl: config.translateEidToUrl(track.eId),
      })),
    )
    .then((tracks) => {
      handler(tracks);
    });
};

exports.model = exports;
