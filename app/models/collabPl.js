/**
 * collaborative playlist model
 * @author adrienjoly, whyd
 **/

var mongodb = require('./mongodb.js');
var postModel = require('./post.js');

var db = mongodb.collections;

// core methods

exports.remove = function (q, cb) {
  db['collabPl'].remove(q, function (error, result) {
    if (error) console.error('collabPl.remove() error: ', error, error.stack);
    else console.log('=> removed collabPl:', result);
    if (cb) cb(result);
  });
};

exports.save = function (playlist, cb) {
  if (!playlist) {
    console.error('warning: null playlist in collabPl.save()');
    cb();
  } else if (playlist._id)
    // TODO: update() is deprecated => use updateOne() (new api)
    db['collabPl'].update(
      { _id: mongodb.ObjectId('' + playlist._id) },
      { $set: playlist },
      /*{upsert:true},*/ function (error, result) {
        if (error) console.error('collabPl.save() error: ', error, error.stack);
        else console.log('=> saved collabPl:', result);
        if (cb) cb(result);
      }
    );
  // TODO: insert() is deprecated => use insertOne() (new api)
  else
    db['collabPl'].insert(playlist, function (error, result) {
      if (error) console.error('collabPl.save() error: ', error, error.stack);
      else console.log('=> saved collabPl:', result);
      if (cb) cb(result);
    });
};

exports.fetchPlaylist = function (q, params, handler) {
  db['collabPl'].findOne(q, params, function (err, playlist) {
    if (err) console.error(err);
    handler(playlist);
  });
};

exports.fetchPlaylists = function (q, params, handler) {
  db['collabPl'].find(q, params, function (err, cursor) {
    if (err) console.error(err);
    cursor.toArray(function (err, playlists) {
      if (err) console.error(err);
      else
        console.log(
          '=> fetched',
          (playlists || []).length,
          'playlists from collabPl'
        );
      handler(playlists);
    });
  });
};

// helpers

exports.fetchPlaylistById = function (id, handler) {
  exports.fetchPlaylist({ _id: mongodb.ObjectId('' + id) }, {}, handler);
};

exports.fetchPlaylistsByUid = function (uId, handler) {
  exports.fetchPlaylists(
    { members: { $in: ['' + uId, mongodb.ObjectId('' + uId)] } },
    {},
    handler
  );
};

exports.fetchPostsByPlaylistId = function (id, params, handler) {
  var q = { 'pl.collabId': { $in: ['' + id, mongodb.ObjectId('' + id)] } };
  params = params || {};
  var options = {};
  //params.sort = params.sort || [['_id','desc']];
  if (params.after) {
    options.after = params.after;
    delete params.after;
  }
  postModel.fetchPosts(q, params, options, handler);
};

exports.model = exports;
