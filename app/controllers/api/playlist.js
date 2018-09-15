/**
 * api endpoint for playlists
 * @author adrienjoly, whyd
 **/

var snip = require('../../snip.js');
var postModel = require('../../models/post.js');
var userModel = require('../../models/user.js');
var notifModel = require('../../models/notif.js');
var plTagsModel = require('../../models/plTags.js');
var uploadCtr = require('../uploadedFile.js');

var MAX_TAGS_PER_PLAYLIST = 3;

exports.actions = {
  sendToUsers: notifModel.sendPlaylistToUsers,
  create: function(p, callback) {
    userModel.createPlaylist(p.uId, p.name, callback);
    // returns {id, name}
  },
  rename: function(p, callback) {
    userModel.renamePlaylist(p.uId, p.id, p.name, callback);
  },
  delete: function(p, callback) {
    userModel.deletePlaylist(p.uId, p.id, callback);
  },
  setOrder: function(p, cb) {
    if (!p || !p.order || !p.id) cb({ error: 'missing parameters' });
    else postModel.setPlaylistOrder(p.uId, p.id, p.order, cb);
  },
  update: function(p, cb) {
    if (p && p.img) {
      var imgPath = uploadCtr.config.uPlaylistDir + '/' + p.uId + '_' + p.id;
      uploadCtr.deleteFile(imgPath);
      userModel.fetchPlaylist(p.uId, p.id, function(pl) {
        /*
				if (pl && pl.img && pl.img.indexOf("blank") == -1) {
					console.log("deleting previous playlist pic: " + pl.img);
					uploadCtr.deleteFile(pl.img);
				}
				function actualUpdate(newFilename) {
					userModel.setPlaylistImg(p.uId, p.id, newFilename || p.img, cb);
				}*/
        if (p.img.indexOf('blank') == -1)
          uploadCtr.renameTo(p.img, imgPath, function() {
            cb(pl);
          });
        else cb(pl);
      });
    } else cb({ error: 'missing parameters' });
  }
};

exports.handlePostRequest = function(request, reqParams, response) {
  request.logToConsole('aoi.playlist.handleRequest', reqParams);

  // make sure a registered user is logged, or return an error page
  var user = request.checkLogin(/*response*/);
  if (
    false == user ||
    !reqParams ||
    !reqParams.action ||
    !exports.actions[reqParams.action]
  )
    return response.badRequest();

  reqParams.uId = user.id;
  reqParams.uNm = user.name;

  exports.actions[reqParams.action](reqParams, function(res, args) {
    console.log(reqParams, '=>', res);
    response.render(res, null, args || { 'content-type': 'application/json' });
  });
};

function fetchPlaylist(p, cb) {
  p = p || {};
  if (!p.id) return cb({ error: 'missing id parameter' });
  var playlists = [], // output of the function
    plIdSet = {},
    uidList = [];
  var plIds = (typeof p.id == 'object' && p.id.length ? p.id : [p.id]).map(
    function(plId) {
      var plId = '' + plId;
      plIdSet[plId] = {};
      uidList.push(plId.split('_')[0]);
      return plId;
    }
  );
  userModel.fetchMulti(
    { _id: { $in: uidList } },
    { fields: { name: 1, pl: 1 } },
    function(userList) {
      // populate userSet
      var userSet = {};
      for (var i in userList) userSet['' + userList[i]._id] = userList[i];
      // populate plIdSet
      for (var i in plIdSet) {
        var plId = i.split('_');
        var userPl = (userSet[plId[0]] || {}).pl || [];
        for (var j in userPl)
          if (userPl[j].id == plId[1]) plIdSet[i] = userPl[j];
      }
      // for each playlist, fetch number of tracks
      (function next(i) {
        if (i >= plIds.length) return cb(playlists);
        var plId = plIds[i].split('_');
        if (plId.length != 2) next(i + 1);
        else
          postModel.countPlaylistPosts(plId[0], plId[1], function(c) {
            playlists.push({
              id: '' + plIds[i],
              name: plIdSet[plIds[i]].name,
              uId: plId[0],
              uNm: (userSet[plId[0]] || {}).name,
              plId: plId[1],
              nbTracks: c
            });
            next(i + 1);
          });
      })(0);
    }
  );
}

function includeTags(playlists, cb) {
  plTagsModel.getTagEngine(function(tagEngine) {
    //var plIdToTags = (tagEngine.plIdToTags || {});
    // for each playlist, fetch number of tracks
    (function next(i) {
      if (i >= playlists.length) return cb(playlists);
      //playlists[i].tags = plIdToTags[playlists[i].id].map(function(tag){ return {id: tag}; });
      postModel.fetchPlaylistPosts(
        playlists[i].uId,
        playlists[i].plId,
        { limit: 10, fields: { name: 1, eId: 1 } },
        function(posts) {
          var tagSet = {};
          playlists[i].lastArtists = [];
          for (var j in posts) {
            var artist = snip.detectArtistName((posts[j] || {}).name);
            if (artist) playlists[i].lastArtists.push(artist);
            (tagEngine.getTagsByEid((posts[j] || {}).eId) || []).map(function(
              tag
            ) {
              tagSet[tag.id] = (tagSet[tag.id] || 0) + tag.c;
            });
          }
          playlists[i].tags = snip.mapToObjArray(tagSet, 'id', 'c');
          playlists[i].tags = playlists[i].tags.sort(function(a, b) {
            return b.c - a.c;
          });
          playlists[i].tags = playlists[i].tags.slice(0, MAX_TAGS_PER_PLAYLIST);
          next(i + 1);
        }
      );
    })(0);
  });
}

exports.controller = function(request, getParams, response) {
  getParams = getParams || {};
  getParams.id = getParams.id || getParams._1;
  request.logToConsole('apiPost.controller', getParams);
  if (request.method.toLowerCase() === 'post')
    exports.handlePostRequest(request, request.body, response);
  else if (getParams.id)
    fetchPlaylist(getParams, function(playlists) {
      if (getParams.includeTags)
        includeTags(playlists, function() {
          response.renderJSON(playlists);
        });
      else response.renderJSON(playlists);
    });
  else response.badRequest();
};
