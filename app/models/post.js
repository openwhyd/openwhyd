/**
 * post model
 * @author adrienjoly, whyd
 **/

var mongodb = require('./mongodb.js');
var ObjectId = mongodb.ObjectId; //ObjectID.createFromHexString;
var db = mongodb.collections;

var snip = require('../snip.js');

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

exports.forEachPost = function (q, p, handler) {
  mongodb.collections['post'].find(q, p, function (err, cursor) {
    cursor.forEach(
      (err, track) => {
        if (err) console.log('post.forEachPost error:', err);
        if (track) handler(track);
      },
      () => handler() // we're done
    );
  });
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

exports.fetchPosts = function (query, params, options, handler) {
  params = params || {};
  processAdvQuery(query, params, options);
  //console.log("status.fetchPosts, query=", query);
  mongodb.collections['post'].find(query, params, function (err, cursor) {
    if (err) console.error(err);
    cursor.toArray(function (err, results) {
      if (err)
        console.error(
          'model.fetchPosts ERROR on query',
          query,
          'with params',
          params,
          ':',
          err
        );
      results = results || [];
      processPosts(results);
      // console.log('=> fetched ' + results.length + ' posts');
      handler(results);
    });
  });
};

// more specific functions

exports.fetchAll = function (handler, after, limit) {
  console.log('post.fetchAll... after=', after);
  exports.fetchPosts(
    {},
    {},
    { limit: limit, after: after /*, before:before*/ },
    handler
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
    handler
  );
};

exports.fetchByAuthors = function (uidList, options, cb) {
  //console.time("post.fetchByAuthors2...");
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
      //console.timeEnd("post.fetchByAuthors2...");
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
    handler
  );
};

exports.countUserPosts = function (uid, handler) {
  mongodb.collections['post'].countDocuments(
    { uId: uid, rTo: null },
    function (err, result) {
      handler(result);
    }
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
    }
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
        post
      );
      if (handler) handler(post);
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

exports.savePost = function (postObj, handler) {
  //console.log("post.savePost: ", postObj);
  var pId = postObj._id;
  function whenDone(error, result) {
    if (error) console.error('post.savePost() error: ', error);
    //console.log("post.savePost() result: ", result);
    if (result) {
      if (Array.isArray(result)) result = result[0];
      result.isNew = !pId;
    }
    handler(result);
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
          whenDone
        );
      }
    );
  } else
    mongodb.collections['post'].insertOne(postObj, function (error, result) {
      if (error) console.log('update error', error);
      whenDone(error, error ? {} : result.ops[0]);
    });
};

var fieldsToCopy = {
  name: true,
  eId: true,
  img: true,
  //	nbP: true
}; // => not: _id, uId, uNm, text, pl, order, repost, src, lov, nbR, nbP

exports.rePost = function (pId, repostObj, handler) {
  //console.log("post.rePost: ", pId, repostObj);
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
    collection.insertOne(repostObj, function (error, result) {
      //console.log("result", result);
      if (error) console.error('post.rePost() error: ', error);
      result = result.ops[0];
      if (repostObj.uId != repostObj.repost.uId) {
        collection.updateOne(
          { _id: ObjectId('' + pId) },
          { $inc: { nbR: 1 } },
          { w: 0 }
        );
      }
      if (result && result.length) {
        result = result[0];
      }
      handler(result);
    });
  });
};

exports.deletePost = function (pId, handler, uId) {
  console.log('post.deletePost: ', pId, uId);
  var collection = mongodb.collections['post'];
  var q = {
    _id: ObjectId(pId),
  };
  if (uId) q.uId = uId;
  exports.fetchPostById(pId, function (postObj) {
    if (postObj)
      collection.deleteOne(q, function (error, result) {
        if (error) console.log('post.deletePost() error: ', error);
        handler(result);
        if (postObj.repost)
          collection.updateOne(
            { _id: ObjectId('' + postObj.repost.pId) },
            { $inc: { nbR: -1 } },
            { w: 0 }
          );
      });
    else {
      console.log('post.deletePost() error: ', pId);
      handler();
    }
  });
};

exports.incrPlayCounter = function (pId, cb) {
  var _id = ObjectId('' + pId);
  if (!_id) cb();
  mongodb.collections['post'].updateOne(
    { _id: _id },
    { $inc: { nbP: 1 } },
    function (err) {
      if (err) console.log(err);
      //cb && cb(res || err);
      exports.fetchPostById(pId, function (postObj) {
        cb && cb(postObj || err);
      });
    }
  );
};

// wrappers for playlists

exports.fetchPlaylistPosts = function (uId, plId, options = {}, handler) {
  //console.log("fetchPlaylistPosts(uId, plId, options) + order: ", uId, plId, options, playlistSort);
  options = {
    limit: options.limit,
    after: options.after,
    before: options.before,
  };
  ////console.time("fetchPlaylistPosts");
  exports.fetchPosts(
    { uId, 'pl.id': parseInt(plId) /*{$in:[parseInt(plId), ""+plId]}*/ },
    playlistSort,
    options,
    handler /*function(){
    //console.timeEnd("fetchPlaylistPosts");
    handler.apply(null, arguments);
  }*/
  );
};

exports.countPlaylistPosts = function (uId, plId, handler) {
  function handle(err, result) {
    handler(result);
  }
  if (uId)
    db['post'].countDocuments(
      { uId: uId, 'pl.id': parseInt(plId) /*{$in:[parseInt(plId), ""+plId]}*/ },
      handle
    );
  else
    db['post'].countDocuments(
      { 'pl.collabId': { $in: ['' + plId, ObjectId('' + plId)] } },
      handle
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
    }
  );
};

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
      if (err) console.log(err);
      if (handler) handler(res);
    }
  );
};

exports.setPlaylistOrder = function (uId, plId, order = [], handler) {
  console.log(
    'post.setPlaylistOrder(uId, plId, order.length): ',
    uId,
    plId,
    order.length
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
