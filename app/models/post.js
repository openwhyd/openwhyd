// @ts-check

/**
 * post model
 * @author adrienjoly, whyd
 **/

const mongodb = require('./mongodb.js');
const ObjectId = mongodb.ObjectId;
const db = mongodb.collections;

const snip = require('../snip.js');
const notif = require('../models/notif.js');
const searchModel = require('../models/search.js');
const activityModel = require('../models/activity.js');
const notifModel = require('../models/notif.js');
const { fetchUserNameById } = require('./user.js');
const assert = require('node:assert');

const NB_POSTS = process.appParams?.nbPostsPerNewsfeedPage;

const DEFAULT_SORT = /** @type const */ ({ _id: 'desc' }); // descending _id => antichronological order

const playlistSort = {
  sort: [
    ['order', 'asc'],
    ['_id', 'desc'],
  ],
};

function processPosts(results) {
  for (const i in results) results[i].lov = results[i].lov || [];
  return results;
}

// core functions

exports.count = function (q, o, cb) {
  mongodb.collections['post'].countDocuments(q, o || {}).then(
    (res) => cb(null, res),
    (err) => cb(err),
  );
};

function processAdvQuery(query, params, options) {
  query = query || {};
  params = params || {};
  options = options || {};
  params.limit = (parseInt(options.limit) || NB_POSTS) + 1;
  if (options.before != null) {
    if (mongodb.isObjectId(options.before))
      query._id = { $gt: ObjectId('' + options.before) };
    else if (!isNaN(parseInt(options.before)))
      //if (params.sort == playlistSort.sort)
      query.order = { $lt: parseInt(options.before) };
  }
  if (options.after != null) {
    if (mongodb.isObjectId(options.after))
      query._id = { $lt: ObjectId('' + options.after) };
    else if (!isNaN(parseInt(options.after)))
      //if (params.sort == playlistSort.sort)
      query.order = { $gt: parseInt(options.after) };
  }
  if (options.until)
    query._id = {
      $gt: mongodb.ObjectId(mongodb.dateToHexObjectId(options.until)),
    };
  if (!params.sort) params.sort = [/*['rTm','desc'],*/ ['_id', 'desc']]; // by default
}

// called by `/all` route, among others
exports.fetchPosts = async function (query, params, options, handler) {
  params = params || {};
  processAdvQuery(query, params, options);
  const { fields } = params ?? {};
  if (params) delete params.fields;
  let results = [];
  try {
    results = await mongodb.collections['post']
      .find(query, params)
      .project(fields ?? {})
      .toArray();
  } catch (err) {
    console.error(
      'model.fetchPosts ERROR on query',
      query,
      'with params',
      params,
      ':',
      err,
    );
  }
  processPosts(results);
  handler(results);
};

// more specific functions

exports.fetchAll = function (handler, after, limit) {
  console.log('post.fetchAll... after=', after);
  exports.fetchPosts(
    {},
    {},
    { limit: limit, after: after /*, before:before*/ },
    handler,
  );
};

exports.fetchByAuthorsOld = function (uidList, options, handler) {
  console.log('post.fetchByAuthors...');
  const query = {
    uId: { $in: uidList },
    'repost.uId': { $nin: uidList },
  };
  exports.fetchPosts(
    query,
    {},
    { after: options.after, before: options.before, limit: options.limit },
    handler,
  );
};

// called by /stream endpoint, among others
exports.fetchByAuthors = async function (uidList, options, cb) {
  const posts = [],
    query = { uId: uidList.length > 1 ? { $in: uidList } : uidList[0] },
    uidSet = snip.arrayToSet(uidList);
  const _params = {}; //{after:options.after, before:options.before, limit:(options.limit || NB_POSTS) + 1};
  processAdvQuery(query, _params, {
    after: options.after,
    before: options.before,
    limit: options.limit,
  });

  // we may exclude some documents from the cursor => don't pass limit to find()
  const nbRequestedPosts = (parseInt(options.limit) || NB_POSTS) + 1;

  const cursor = mongodb.collections['post'].find(query).sort(DEFAULT_SORT);
  try {
    while ((await cursor.hasNext()) && posts.length < nbRequestedPosts) {
      const post = await cursor.next();
      if (post && !post.error && !uidSet[(post.repost || {}).uId]) {
        posts.push(post);
      }
    }
  } catch (err) {
    console.error('Error in fetchByAuthors:', err);
  }
  await cursor.close();
  cb(processPosts(posts));
};

exports.fetchRepostsFromMe = function (uid, options, handler) {
  console.log('post.fetchRepostsFromMe...');
  const query = {
    uId: { $nin: ['' + uid] },
    'repost.uId': '' + uid,
  };
  exports.fetchPosts(
    query,
    {},
    {
      after: options.after,
      before: options.before,
      limit: options.limit,
      until: options.until,
    },
    handler,
  );
};

exports.countUserPosts = function (uid, handler) {
  mongodb.collections['post'].countDocuments({ uId: uid }).then(
    (res) => handler(res),
    (err) => {
      console.trace('countUserPosts', err);
      handler();
    },
  );
};

exports.model = exports;

// used by apiPost (for loves)
exports.fetchPostById = function (pId, handler) {
  mongodb.collections['post'].findOne({ _id: ObjectId('' + pId) }).then(
    (res) => handler(res),
    (err) => {
      console.trace('fetchPostsById', err);
      handler();
    },
  );
};

exports.isPostLovedByUid = function (pId, uId, handler) {
  exports.fetchPostById(pId, function (post) {
    handler(post ? snip.arrayHas(post.lov, uId) : false, post);
  });
};

/** @param {import('mongodb').Collection} collection */
async function setPostLove(collection, pId, uId, state, handler) {
  const update = state
    ? { $push: { lov: '' + uId } }
    : { $pull: { lov: '' + uId } };
  await collection.updateOne({ _id: ObjectId('' + pId) }, update);
  const post = await collection.findOne({ _id: ObjectId('' + pId) });
  if (post && uId != post.uId) notif[state ? 'love' : 'unlove'](uId, post);
  handler?.(post);
  if (state)
    activityModel.addLikeByPost(post, {
      id: uId,
      name: await fetchUserNameById(uId),
    });
  else activityModel.removeLike(pId, uId);
}

exports.lovePost = function (pId, uId, handler) {
  setPostLove(mongodb.collections['post'], pId, uId, true, handler);
};

exports.unlovePost = function (pId, uId, handler) {
  setPostLove(mongodb.collections['post'], pId, uId, false, handler);
};

exports.countLovedPosts = function (uid, callback) {
  db['post'].countDocuments({ lov: '' + uid }).then(
    (res) => callback(res),
    (err) => {
      console.trace('countLovedPosts', err);
      callback();
    },
  );
};

function notifyMentionedUsers(post, cb) {
  const mentionedUsers = snip.extractMentions(post.text),
    comment = { uId: post.uId, uNm: post.uNm };
  if (mentionedUsers.length) {
    // notif mentioned users
    snip.forEachArrayItem(
      mentionedUsers,
      function (mentionedUid, next) {
        notifModel.mention(post, comment, mentionedUid, next);
      },
      cb,
    );
  }
}

exports.savePost = function (postObj, handler) {
  const pId = postObj._id;
  async function whenDone(error, result) {
    if (error || !result) {
      console.error('post.savePost() error: ', error);
      handler();
    }
    if (result) {
      console.log('savePost::whenDone', { result });
      if (Array.isArray(result)) result = result[0];
      const post = await mongodb.collections['post'].findOne({
        _id: ObjectId('' + result._id),
      });
      searchModel.indexTyped('post', post);
      post.isNew = !pId;
      if (post.isNew) notif.post(post);
      notifyMentionedUsers(post);
      handler(post);
    }
  }
  if (postObj.pl && typeof postObj.pl.id !== 'number')
    postObj.pl.id = parseInt('' + postObj.pl.id);
  if (pId) {
    delete postObj._id;
    const update = { $set: postObj };
    if (postObj.pl == null || isNaN(postObj.pl.id)) {
      delete update.$set.pl;
      update.$unset = { pl: 1 };
    }
    mongodb.collections['post']
      .updateOne({ _id: ObjectId('' + pId) }, update)
      .catch((error) => console.trace('post update error', error))
      .finally(() => {
        mongodb.collections['post'].findOne({ _id: ObjectId('' + pId) }).then(
          (res) => whenDone(null, res),
          (err) => whenDone(err),
        );
      });
  } else
    mongodb.collections['post'].insertOne(postObj).then(
      (res) => whenDone(null, { _id: res.insertedId }),
      (err) => whenDone(err, {}),
    );
};

const fieldsToCopy = {
  name: true,
  eId: true,
  img: true,
  //	nbP: true
}; // => not: _id, uId, uNm, text, pl, order, repost, src, lov, nbR, nbP

exports.rePost = function (pId, repostObj, handler) {
  const collection = mongodb.collections['post'];
  exports.fetchPostById(pId, function (postObj) {
    postObj = postObj || { error: 'post not found' };
    if (postObj.error) {
      handler(postObj);
      return;
    }
    for (const i in fieldsToCopy)
      if (/*repostObj[i] == null &&*/ postObj[i] != null)
        repostObj[i] = postObj[i];
    repostObj.repost = { pId: pId, uId: postObj.uId, uNm: postObj.uNm };
    repostObj.lov = [];
    repostObj.nbR = 0;
    repostObj.nbP = 0;
    delete repostObj._id;
    if (repostObj.pl && typeof repostObj.pl.id !== 'number')
      repostObj.pl.id = parseInt('' + repostObj.pl.id);
    collection.insertOne(repostObj).then(
      async function (result) {
        if (repostObj.uId != repostObj.repost.uId) {
          notif.repost(repostObj.uId, postObj);
          notif.post(postObj);
          collection.updateOne(
            { _id: ObjectId('' + pId) },
            { $inc: { nbR: 1 } },
          );
        }
        const post = await mongodb.collections['post'].findOne({
          _id: ObjectId('' + result.insertedId),
        });
        //searchModel.indexPost(post);
        searchModel.indexTyped('post', post);
        notifyMentionedUsers(post);
        handler(post);
      },
      (err) => {
        console.trace('post.rePost() error: ', err);
        handler();
      },
    );
  });
};

exports.deletePost = function (pId, uId, handler) {
  const collection = mongodb.collections['post'];
  const q = {
    _id: ObjectId(pId),
  };
  if (uId) q.uId = uId;
  exports.fetchPostById(pId, async function (postObj) {
    if (postObj) {
      if (postObj.uId !== uId) {
        handler(new Error("can't delete another user's post"));
        return;
      }
      let result = null;
      try {
        result = await collection.deleteOne(q);
      } catch (error) {
        console.trace('post.deletePost() error: ', error);
      }
      searchModel.deleteDoc('post', pId);
      handler(null, result);
      if (postObj.repost)
        collection.updateOne(
          { _id: ObjectId('' + postObj.repost.pId) },
          { $inc: { nbR: -1 } },
        );
    } else {
      handler(new Error('post not found'));
    }
  });
};

exports.incrPlayCounter = function (pId, cb) {
  let _id;
  try {
    _id = ObjectId('' + pId);
    if (!_id) throw new Error('empty ObjectId');
  } catch (err) {
    cb();
  }
  mongodb.collections['post'].updateOne({ _id }, { $inc: { nbP: 1 } }).then(
    async (/*updateRes*/) => {
      await new Promise((resolve) => exports.fetchPostById(pId, resolve));
      cb?.({});
    },
    (err) => cb?.(err) ?? console.trace('incrPlayCounter', err),
  );
};

// wrappers for playlists

exports.fetchPlaylistPosts = function (uId, plId, options = {}, handler) {
  options = {
    limit: options.limit,
    after: options.after,
    before: options.before,
  };
  exports.fetchPosts(
    { uId, 'pl.id': parseInt(plId) },
    playlistSort,
    options,
    handler,
  );
};

exports.countPlaylistPosts = async function (uId, plId, handler) {
  assert.ok(uId, 'countPlaylistPosts: uId is required');
  const nbPosts = await db['post'].countDocuments({
    uId,
    'pl.id': parseInt(plId, 10),
  });
  handler(nbPosts);
};

exports.setPlaylist = function (uId, plId, plName, handler) {
  const criteria = {
    uId: uId,
    'pl.id': parseInt(plId),
  };
  const update = { $set: { pl: { id: parseInt(plId), name: plName } } };
  mongodb.collections['post'].updateMany(criteria, update).then(
    (res) => handler?.(res),
    (err) => {
      console.trace('post.setPlaylist =>', err);
      handler?.();
    },
  );
};

/** Delete a user's playlist */
exports.unsetPlaylist = function (uId, plId, handler) {
  const criteria = {
    uId: uId,
    'pl.id': parseInt(plId),
  };
  const update = { $unset: { pl: 1 } };
  mongodb.collections['post'].updateMany(criteria, update).then(
    (res) => handler?.(res),
    (err) => {
      console.trace('post.unsetPlaylist =>', err);
      handler?.();
    },
  );
};

exports.setPlaylistOrder = function (uId, plId, order = [], handler) {
  const collection = mongodb.collections['post'];
  function next(err) {
    if (err) console.trace('setPlaylistOrder error', err);
    if (!order.length) handler({ ok: 1 });
    else {
      const post = {
        _id: ObjectId('' + order.pop()),
        uId: uId,
        'pl.id': parseInt(plId),
      };
      collection.updateOne(post, { $set: { order: order.length } }).then(
        () => next(null),
        (err) => next(err),
      );
    }
  }
  next();
};
