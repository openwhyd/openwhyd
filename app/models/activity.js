// @ts-check

/**
 * activity model
 * @author adrienjoly, whyd
 **/

const mongodb = require('../models/mongodb.js');
const postModel = require('../models/post.js');
const followModel = require('../models/follow.js');

const ObjectId = mongodb.ObjectId;

const DEFAULT_LIMIT_HISTORY = 10;

function getCol() {
  return mongodb.collections['activity'];
}

// primitives

exports.fetch = function (q, options, callback) {
  options = options || {};
  if (options.after) q._id = { $lt: ObjectId('' + options.after) };
  if (options.until)
    q._id = { $gt: mongodb.ObjectId(mongodb.dateToHexObjectId(options.until)) };
  options.sort = options.sort || [['_id', 'desc']];
  getCol()
    .find(q, options)
    .toArray()
    .then(
      (res) => callback(res),
      (err) => {
        console.trace('error in activity.fetch:', err);
        callback();
      },
    );
};

exports.add = async function (d, callback) {
  if (d && d.like && d.like.pId) d.like.pId = '' + d.like.pId;
  return getCol().insertOne(d).then(callback, callback);
};

exports.remove = function (q, callback) {
  getCol().deleteOne(q).then(callback, callback);
};

// fetch helpers

exports.fetchLikersOfUser = function (uid, options, callback) {
  exports.fetch({ 'like.id': '' + uid }, options, callback);
};

exports.fetchHistoryFromUidList = function (uidList, options, callback) {
  options = options || {};
  const limit = options.limit || DEFAULT_LIMIT_HISTORY;
  options.limit = limit + 1;
  const q = { id: { $in: uidList } };
  if (options.likesOnly) q.like = { $exists: true };
  function whenDone(activities) {
    activities = activities.sort(function (a, b) {
      return b._id.getTimestamp() - a._id.getTimestamp(); // sort by _id
    });
    //console.log("sorted likes with subscr:", activities);
    const hasMore = activities && activities.length > limit;
    if (hasMore) activities = activities.slice(0, limit);
    //console.log("filtered likes with subscr:", activities);
    // console.log(
    //   '=> reduced to',
    //   activities.length,
    //   'activities, hasmore:',
    //   hasMore
    // );
    callback(activities, hasMore);
  }
  exports.fetch(q, options, function (activities) {
    //console.log("likes:", activities);
    // console.log('=> fetched', activities.length, 'likes');
    if (options.likesOnly) return whenDone(activities);
    options.fromUId = uidList;
    followModel.fetchSubscriptionHistory(options, function (subscriptions) {
      for (const i in subscriptions)
        activities.push({
          _id: subscriptions[i]._id,
          id: subscriptions[i].uId,
          name: subscriptions[i].uNm,
          subscription: {
            id: subscriptions[i].tId,
            name: subscriptions[i].tNm,
          },
        });
      //console.log("unsorted likes with subscr:", activities);
      whenDone(activities);
    });
  });
};

// update helpers

exports.addLikeByPost = function (post, liker, callback) {
  if (post)
    exports.add(
      {
        id: liker.id,
        name: liker.name,
        like: { pId: post._id, id: post.uId, name: post.uNm },
      },
      callback,
    );
  else callback && callback({ error: 'post not found' });
};

exports.addLikeByPid = function (pId, liker, callback) {
  postModel.fetchPostById(pId, function (post) {
    exports.addLikeByPost(post, liker, callback);
  });
};

exports.removeLike = function (pId, likerUid, callback) {
  exports.remove({ 'like.pId': pId, id: '' + likerUid }, callback);
};
