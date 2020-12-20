/**
 * activity model
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');
var followModel = require('../models/follow.js');

var ObjectId = mongodb.ObjectID.createFromHexString;

var DEFAULT_LIMIT_HISTORY = 10;

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
  getCol().find(q, options, function (err, results) {
    results.toArray(function (err, results) {
      callback(results);
    });
  });
};

exports.add = function (d, callback) {
  if (d && d.like && d.like.pId) d.like.pId = '' + d.like.pId;
  getCol().insertOne(d, function (err, result) {
    callback && callback(result || err);
  });
};

exports.remove = function (q, callback) {
  getCol().deleteOne(q, function (err, result) {
    callback && callback(result || err);
  });
};

// fetch helpers

/*
exports.countUserLikes = function(uid, callback) {
	getCol().countDocuments({"like.pId":{$exists: true}, "id":""+uid}, function(err, count) {
		callback(count);
	});
}
*/

exports.fetchLikersOfUser = function (uid, options, callback) {
  exports.fetch({ 'like.id': '' + uid }, options, callback);
};

exports.fetchHistoryFromUidList = function (uidList, options, callback) {
  options = options || {};
  var limit = options.limit || DEFAULT_LIMIT_HISTORY;
  options.limit = limit + 1;
  var q = { id: { $in: uidList } };
  if (options.likesOnly) q.like = { $exists: true };
  function whenDone(activities) {
    activities = activities.sort(function (a, b) {
      return b._id.getTimestamp() - a._id.getTimestamp(); // sort by _id
    });
    //console.log("sorted likes with subscr:", activities);
    var hasMore = activities && activities.length > limit;
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
    //followModel.fetchUsersSubscriptionsHistory(uidList, options, function(subscriptions) {
    followModel.fetchSubscriptionHistory(options, function (subscriptions) {
      for (let i in subscriptions)
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
      callback
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
