// @ts-check

/**
 * "follow" model, for subscriptions
 * @author adrienjoly, whyd
 **/

const snip = require('../snip.js');
const mongodb = require('./mongodb.js');
const ObjectId = mongodb.ObjectId;

const COLNAME = 'follow';
const HISTORY_LIMIT = 20;

// utility functions

function transformSubscriptionArray(results) {
  if (results)
    for (const i in results)
      results[i] = {
        id: ('' + results[i].tId).replace('/u/', ''),
        name: results[i].tNm,
      };
  return results;
}

function transformSubscriberArray(results) {
  if (results)
    for (const i in results)
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
  if (query.uId?.generationTime) query.uId = '' + query.uId;
  if (query.tId?.generationTime) query.tId = '' + query.tId;
  const { fields } = options ?? {};
  if (options) delete options.fields;
  const results = await mongodb.collections[COLNAME].find(query, options || {})
    .project(fields ?? {})
    .toArray();
  callback(results);
}

exports.get = function (followObj, dbHandler) {
  mongodb.collections[COLNAME].findOne(followObj, dbHandler);
};

exports.add = function (followObj, dbHandler) {
  const req = {
    uId: followObj.uId,
    tId: followObj.tId,
  };
  const collection = mongodb.collections[COLNAME];
  collection.updateOne(req, { $set: followObj }, { upsert: true }).then(
    () =>
      collection.findOne(req).then(
        (res) => dbHandler(null, res),
        (err) => dbHandler(err),
      ),
    (err) => dbHandler(err),
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

exports.countSubscriptions = function (uId, cb) {
  mongodb.collections[COLNAME].countDocuments({ uId: '' + uId }).then(
    (res) => cb(res),
    (error) => cb({ error }),
  );
};

exports.countSubscribers = function (uId, cb) {
  mongodb.collections[COLNAME].countDocuments({ tId: '' + uId }).then(
    (res) => cb(res),
    (error) => cb({ error }),
  );
};

exports.fetchUserSubscriptions = function (uid, callback) {
  const result = {
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
    for (const i in subscr) subscr[i] = subscr[i].tId;
    cb(subscr);
  });
};

exports.fetchSubscriptionHistory = function (options, callback) {
  options = options || {};
  const q = {};
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
