/**
 * post model
 * @author adrienjoly, whyd
 **/

var mongodb = require('./mongodb.js');
const ObjectId = mongodb.ObjectId;
var db = mongodb.collections;

var snip = require('../snip.js');
var notif = require('../models/notif.js');
var searchModel = require('../models/search.js');
var activityModel = require('../models/activity.js');
var trackModel = require('../models/track.js');
var notifModel = require('../models/notif.js');
const uploadCtr = require('../controllers/uploadedFile.js');

var config = require('../models/config.js');
var NB_POSTS = config.nbPostsPerNewsfeedPage;

var playlistSort = {
  sort: [
    ['order', 'asc'],
    ['_id', 'desc'],
  ],
};

function processPosts(results) {
  for (let i in results) results[i].lov = results[i].lov || [];
  return results;
}

// core functions

exports.count = function (q, o, cb) {
  mongodb.collections['post'].countDocuments(q, o || {}, cb);
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
  var query = {
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

exports.fetchByAuthors = function (uidList, options, cb) {
  var posts = [],
    query = { uId: uidList.length > 1 ? { $in: uidList } : uidList[0] },
    uidSet = snip.arrayToSet(uidList);
  var params = {}; //{after:options.after, before:options.before, limit:(options.limit || NB_POSTS) + 1};
  processAdvQuery(query, params, {
    after: options.after,
    before: options.before,
    limit: options.limit,
  });
  var limit = params.limit;
  params.limit = undefined; // prevent forEach2 from limiting cursor
  params.q = query;
  mongodb.forEach2('post', params, function (post, next, closeCursor) {
    if (post && !post.error && !uidSet[(post.repost || {}).uId]) {
      posts.push(post);
    }
    if (!post || !next || posts.length == limit) {
      cb(processPosts(posts));
      closeCursor();
    } else {
      next();
    }
  });
};

exports.fetchRepostsFromMe = function (uid, options, handler) {
  console.log('post.fetchRepostsFromMe...');
  var query = {
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
  mongodb.collections['post'].countDocuments(
    { uId: uid, rTo: null },
    function (err, result) {
      handler(result);
    },
  );
};

exports.model = exports;

// used by apiPost (for loves)
exports.fetchPostById = function (pId, handler) {
  mongodb.collections['post'].findOne(
    { _id: ObjectId('' + pId) },
    function (err, res) {
      if (err) console.log(err);
      handler(res);
    },
  );
};

exports.isPostLovedByUid = function (pId, uId, handler) {
  exports.fetchPostById(pId, function (post) {
    handler(post ? snip.arrayHas(post.lov, uId) : false, post);
  });
};

function setPostLove(collection, pId, uId, state, handler) {
  var update = state
    ? { $push: { lov: '' + uId } }
    : { $pull: { lov: '' + uId } };
  collection.updateOne({ _id: ObjectId('' + pId) }, update, function (err) {
    if (err) console.log(err);
    collection.findOne({ _id: ObjectId('' + pId) }, function (err, post) {
      if (err) console.log(err);
      console.log(
        'setPostLove -> notif',
        pId,
        uId,
        post ? post.uId : null,
        post,
      );
      if (post && uId != post.uId) notif[state ? 'love' : 'unlove'](uId, post);
      if (handler) handler(post);
      if (post) trackModel.updateByEid(post.eId);
      if (state)
        activityModel.addLikeByPost(post, {
          id: uId,
          name: mongodb.getUserNameFromId(uId),
        });
      else activityModel.removeLike(pId, uId);
    });
  });
}

exports.lovePost = function (pId, uId, handler) {
  console.log('lovePost', pId, uId);
  setPostLove(mongodb.collections['post'], pId, uId, true, handler);
};

exports.unlovePost = function (pId, uId, handler) {
  console.log('unLovePost', pId, uId);
  setPostLove(mongodb.collections['post'], pId, uId, false, handler);
};

exports.countLovedPosts = function (uid, callback) {
  db['post'].countDocuments({ lov: '' + uid }, function (err, count) {
    callback(count);
  });
};

function notifyMentionedUsers(post, cb) {
  var mentionedUsers = snip.extractMentions(post.text),
    comment = { uId: post.uId, uNm: post.uNm };
  if (mentionedUsers.length) {
    console.log('notif mentioned users');
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
  var pId = postObj._id;
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
    var update = { $set: postObj };
    if (postObj.pl == null || (isNaN(postObj.pl.id) && !postObj.pl.collabId)) {
      delete update.$set.pl;
      update.$unset = { pl: 1 };
    }
    mongodb.collections['post'].updateOne(
      { _id: ObjectId('' + pId) },
      update,
      function (error) {
        if (error) console.log('update error', error);
        mongodb.collections['post'].findOne(
          { _id: ObjectId('' + pId) },
          whenDone,
        );
      },
    );
  } else
    mongodb.collections['post'].insertOne(postObj, function (error, result) {
      if (error) console.log('update error', error);
      whenDone(error, error ? {} : { _id: result.insertedId });
    });
};

var fieldsToCopy = {
  name: true,
  eId: true,
  img: true,
  //	nbP: true
}; // => not: _id, uId, uNm, text, pl, order, repost, src, lov, nbR, nbP

exports.rePost = function (pId, repostObj, handler) {
  var collection = mongodb.collections['post'];
  exports.fetchPostById(pId, function (postObj) {
    postObj = postObj || { error: 'post not found' };
    if (postObj.error) {
      handler(postObj);
      return;
    }
    for (let i in fieldsToCopy)
      if (/*repostObj[i] == null &&*/ postObj[i] != null)
        repostObj[i] = postObj[i];
    repostObj.repost = { pId: pId, uId: postObj.uId, uNm: postObj.uNm };
    repostObj.lov = [];
    repostObj.nbR = 0;
    repostObj.nbP = 0;
    delete repostObj._id;
    if (repostObj.pl && typeof repostObj.pl.id !== 'number')
      repostObj.pl.id = parseInt('' + repostObj.pl.id);
    collection.insertOne(repostObj, async function (error, result) {
      if (error) {
        console.error('post.rePost() error: ', error);
        handler();
        return;
      }
      if (repostObj.uId != repostObj.repost.uId) {
        notif.repost(repostObj.uId, postObj);
        notif.post(postObj);
        collection
          .updateOne(
            { _id: ObjectId('' + pId) },
            { $inc: { nbR: 1 } },
            { w: 0 },
          )
          .then(() => {
            trackModel.updateByEid(postObj.eId);
          });
      }
      const post = await mongodb.collections['post'].findOne({
        _id: ObjectId('' + result.insertedId),
      });
      //searchModel.indexPost(post);
      searchModel.indexTyped('post', post);
      notifyMentionedUsers(post);
      handler(post);
    });
  });
};

exports.deletePost = function (pId, uId, handler) {
  console.log('post.deletePost: ', pId, uId);
  var collection = mongodb.collections['post'];
  var q = {
    _id: ObjectId(pId),
  };
  if (uId) q.uId = uId;
  exports.fetchPostById(pId, function (postObj) {
    if (postObj) {
      if (postObj.uId !== uId) {
        handler(new Error("can't delete another user's post"));
        return;
      }
      collection.deleteOne(q, function (error, result) {
        if (error) console.log('post.deletePost() error: ', error);
        searchModel.deleteDoc('post', pId);
        handler(null, result);
        if (postObj.repost)
          collection.updateOne(
            { _id: ObjectId('' + postObj.repost.pId) },
            { $inc: { nbR: -1 } },
            { w: 0 },
          );
        trackModel.updateByEid(postObj.eId);
      });
    } else {
      console.log('post.deletePost() error: ', pId);
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
  mongodb.collections['post'].updateOne(
    { _id },
    { $inc: { nbP: 1 } },
    function (err) {
      if (err) console.log(err);
      exports.fetchPostById(pId, function (postObj) {
        if (postObj) trackModel.updateByEid(postObj.eId);
        cb && cb(postObj || err);
      });
    },
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

exports.countPlaylistPosts = function (uId, plId, handler) {
  function handle(err, result) {
    handler(result);
  }
  if (uId)
    db['post'].countDocuments({ uId: uId, 'pl.id': parseInt(plId) }, handle);
  else
    db['post'].countDocuments(
      { 'pl.collabId': { $in: ['' + plId, ObjectId('' + plId)] } },
      handle,
    );
};

exports.setPlaylist = function (uId, plId, plName, handler) {
  console.log('post.setPlaylist', uId, plId, plName);
  var criteria = {
    uId: uId,
    'pl.id': parseInt(plId),
  };
  var update = { $set: { pl: { id: parseInt(plId), name: plName } } };
  mongodb.collections['post'].updateMany(
    criteria,
    update,
    { multi: true },
    function (err, res) {
      if (err) console.log(err);
      if (handler) handler(res);
    },
  );
};

/** Delete a user's playlist */
exports.unsetPlaylist = function (uId, plId, handler) {
  console.log('post.unsetPlaylist', uId, plId);
  var criteria = {
    uId: uId,
    'pl.id': parseInt(plId),
  };
  var update = { $unset: { pl: 1 } };
  mongodb.collections['post'].updateMany(
    criteria,
    update,
    { multi: true },
    function (err, res) {
      if (err) console.log('post.unsetPlaylist =>', err);
      else {
        const imgPath = uploadCtr.getPlaylistImagePath({ uId, id: plId });
        uploadCtr.deleteFile(imgPath).catch(/* don't log if it has no image */);
      }
      if (handler) handler(res);
    },
  );
};

exports.setPlaylistOrder = function (uId, plId, order = [], handler) {
  console.log(
    'post.setPlaylistOrder(uId, plId, order.length): ',
    uId,
    plId,
    order.length,
  );
  var collection = mongodb.collections['post'];
  function next(err) {
    if (err) console.log('error', err);
    if (!order.length) handler({ ok: 1 });
    else {
      var post = {
        _id: ObjectId('' + order.pop()),
        uId: uId,
        'pl.id': parseInt(plId),
      };
      console.log('moving post ', post._id, ' to pos ', order.length);
      collection.updateOne(post, { $set: { order: order.length } }, next);
    }
  }
  next();
};
