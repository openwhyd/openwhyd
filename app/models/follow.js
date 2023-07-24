/**
 * "follow" model, for subscriptions
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('./mongodb.js');
var ObjectId = mongodb.ObjectId; //ObjectID.createFromHexString;

var COLNAME = 'follow';
var HISTORY_LIMIT = 20;

// utility functions

function transformSubscriptionArray(results) {
  if (results)
    for (let i in results)
      results[i] = {
        id: ('' + results[i].tId).replace('/u/', ''),
        name: results[i].tNm,
      };
  return results;
}

function transformSubscriberArray(results) {
  if (results)
    for (let i in results)
      results[i] = {
        id: /*"/u/" +*/ '' + results[i].uId,
        name: results[i].uNm,
      };
  return results;
}

async function fetchArray(query = {}, options, callback) {
  if (typeof query.uId == 'string' && query.uId.indexOf('/u/') == 0)
    console.error('warning: found uId with /u/ prefix');
  if (typeof query.tId == 'string' && query.tId.indexOf('/u/') == 0)
    console.error('warning: found tId with /u/ prefix');
  if ((query.uId || {}).generationTime)
    // is ObjectId
    query.uId = '' + query.uId;
  if ((query.tId || {}).generationTime)
    // is ObjectId
    query.tId = '' + query.tId;
  //console.log("follow.fetchArray", query, "...");
  const { fields } = options ?? {};
  delete options.fields;
  const results = await mongodb.collections[COLNAME].find(query, options || {})
    .project(fields ?? {})
    .toArray();
  //console.log("=> ", results.length, "follow items");
  callback(results);
}

exports.get = function (followObj, dbHandler) {
  mongodb.collections[COLNAME].findOne(followObj, dbHandler);
};

exports.add = function (followObj, dbHandler) {
  var req = {
    uId: followObj.uId,
    tId: followObj.tId,
  };
  var collection = mongodb.collections[COLNAME];
  //collection.save(obj, dbHandler);
  collection.updateOne(
    req,
    { $set: followObj },
    { upsert: true },
    function (err, result) {
      // to avoid duplicates
      if (err) dbHandler(err, result);
      else collection.findOne(req, dbHandler);
    },
  );
};

exports.remove = function (uId, tId, dbHandler) {
  mongodb.collections[COLNAME].deleteOne({ uId: uId, tId: tId }, dbHandler);
};

exports.fetch = function (q, options, callback) {
  fetchArray(q, options, callback);
};

exports.remove = function (uId, tId, dbHandler) {
  mongodb.collections[COLNAME].deleteOne({ uId: uId, tId: tId }, dbHandler);
};

// wraps a cb(result) callback into a cb(err,res) callback
function wrapCallback(cb) {
  return function (err, res) {
    cb(err ? { error: err } : res);
  };
}

exports.countSubscriptions = function (uId, cb) {
  mongodb.collections[COLNAME].countDocuments(
    { uId: '' + uId },
    wrapCallback(cb),
  );
};

exports.countSubscribers = function (uId, cb) {
  mongodb.collections[COLNAME].countDocuments(
    { tId: '' + uId },
    wrapCallback(cb),
  );
};

exports.fetchUserSubscriptions = function (uid, callback) {
  var result = {
    subscriptions: [],
    subscribers: [],
  };
  fetchArray(
    { uId: uid },
    { sort: [['_id', 'desc']] },
    function (subscriptions) {
      result.subscriptions = transformSubscriptionArray(subscriptions);
      fetchArray(
        { tId: uid },
        { sort: [['_id', 'desc']] },
        function (subscribers) {
          result.subscribers = transformSubscriberArray(subscribers);
          callback(result);
        },
      );
    },
  );
};

// HELPERS

exports.fetchSubscriptionSet = function (uid, callback) {
  fetchArray(
    { uId: uid },
    { fields: { _id: 0, tId: 1 } },
    function (subscriptions) {
      callback(snip.objArrayToSet(subscriptions, 'tId'));
    },
  );
};

exports.fetchSubscriptionArray = function (uid, cb) {
  fetchArray({ uId: uid }, { fields: { _id: 0, tId: 1 } }, function (subscr) {
    for (let i in subscr) subscr[i] = subscr[i].tId;
    cb(subscr);
  });
};
/*
exports.fetchUsersSubscriptionsHistory = function(uidList, options, callback) {
	options = options || {};
	var q = {
		uId: {$in: uidList}, // show subscriptions from subscribed users
	};
	if (options.after)
		q._id = {$lt: ObjectId(""+options.after)};
	fetchArray(q, {sort:[['_id','desc']], limit: options.limit || HISTORY_LIMIT}, callback);
};

exports.fetchSubscriberHistory = function(uid, options, callback) {
	options = options || {};
	var q = {
		uId: {$ne: ""+uid}, // subscriptions from anyone but uid
		tId: ""+uid // ...to uid only
	};
	if (options.after) q._id = {$lt: ObjectId(""+options.after)};
	if (options.until) q._id = {$gt: mongodb.ObjectId(mongodb.dateToHexObjectId(options.until))};
	fetchArray(q, {sort:[['_id','desc']], limit: options.limit || HISTORY_LIMIT}, callback);
};
*/
exports.fetchSubscriptionHistory = function (options, callback) {
  options = options || {};
  var q = {};
  if (options.fromUId) q.uId = { $in: options.fromUId };
  else if (options.toUId) {
    q.uId = { $ne: '' + options.toUId };
    q.tId = '' + options.toUId;
  }
  if (typeof options.excludeTids == 'object')
    q.tId = { $nin: options.excludeTids };
  if (typeof options.excludeCtx == 'string')
    q.ctx = { $nin: [options.excludeCtx] };
  if (options.after) q._id = { $lt: ObjectId('' + options.after) };
  else if (options.until)
    q._id = { $gt: mongodb.ObjectId(mongodb.dateToHexObjectId(options.until)) };
  fetchArray(
    q,
    { sort: [['_id', 'desc']], limit: options.limit || HISTORY_LIMIT },
    callback,
  );
};

/*
exports.addMulti = function(user, subscriptionList, callback) {
	var remaining = subscriptionList.length;
	function callbackWhenDone() {
		if (--remaining == 0)
			callback && callback();
	}
	for (let i in subscriptionList) {
		var tId = subscriptionList[i].id;
		if (tId)
			exports.add({
				uId: user.id,
				uNm: user.name,
				tId: (""+tId).replace("/u/", ""),
				tNm: subscriptionList[i].name
			}, callbackWhenDone);
		else
			callbackWhenDone();
	}
}
*/

exports.fetchFollowing = function (uId, options, cb) {
  options = options || {};
  options.sort = options.sort || [['_id', 'desc']];
  options.fields = options.fields || { _id: 0, tId: 1, tNm: 1 };
  options.limit = options.limit || 50;
  fetchArray({ uId: uId }, options, cb);
};

exports.fetchFollowers = function (uId, options, cb) {
  options = options || {};
  options.sort = options.sort || [['_id', 'desc']];
  options.fields = options.fields || { _id: 0, uId: 1, uNm: 1 };
  options.limit = options.limit || 50;
  fetchArray({ tId: uId }, options, cb);
};
