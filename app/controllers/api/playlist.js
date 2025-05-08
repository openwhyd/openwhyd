//@ts-check
/**
 * api endpoint for playlists
 * @author adrienjoly, whyd
 **/

const postModel = require('../../models/post.js');
const userModel = require('../../models/user.js');
const notifModel = require('../../models/notif.js');
const uploadCtr = require('../uploadedFile.js');

/** @typedef {import('../../domain/OpenWhydFeatures.js').Features} Features */
/** @typedef {Record<string, unknown>} ReqParams */
/** @typedef {{ error?: string } | undefined} ActionCallbackParam */
/** @typedef {(ActionCallbackParam) => void} ActionCallback */

/** @type {Record<string, (p: ReqParams, callback: ActionCallback, features: Features) => void>} */
exports.actions = {
  sendToUsers: notifModel.sendPlaylistToUsers,
  /**
   * @param playlistRequest {{uId:string, name:string}}
   * @param createPlaylist {import ('../../domain/api/Features').CreatePlaylist}
   */
  create: function ({ uId: userId, name }, callback, { createPlaylist }) {
    createPlaylist(userId, name).then(callback);
  },
  rename: function (p, callback) {
    userModel.renamePlaylist(p.uId, p.id, p.name, callback);
  },
  delete: function ({ uId, id: playlistId }, callback, { deletePlaylist }) {
    if (typeof uId !== 'string') return callback({ error: 'invalid uId' });
    if (Number.isNaN(playlistId))
      return callback({ error: 'invalid playlist id' });
    deletePlaylist(uId, Number(playlistId))
      .then(() => callback(playlistId))
      .catch((err) => callback({ error: err.message || err }));
  },
  setOrder: function (p, cb) {
    if (!p || !p.order || !p.id) cb({ error: 'missing parameters' });
    if (!Array.isArray(p.order)) cb({ error: 'invalid order' });
    else postModel.setPlaylistOrder(p.uId, p.id, p.order, cb);
  },
  update: function ({ uId, id, img }, cb) {
    if (typeof img !== 'string') {
      return cb({ error: 'invalid img parameter' });
    }
    if (typeof uId !== 'string') {
      return cb({ error: 'invalid uId parameter' });
    }
    if (typeof id !== 'string') {
      return cb({ error: 'invalid id parameter' });
    }
    const imgPath = uploadCtr.getPlaylistImagePath({ uId, id });
    uploadCtr.deleteFile(imgPath).catch(() => {
      /* nothing to do if file did not exist */
    });
    userModel.fetchPlaylist(uId, id, function (pl) {
      /*
        if (pl && pl.img && pl.img.indexOf("blank") == -1) {
          console.log("deleting previous playlist pic: " + pl.img);
          uploadCtr.deleteFile(pl.img).catch((err) => console.log(err, err.stack));
        }
        function actualUpdate(newFilename) {
          userModel.setPlaylistImg(p.uId, p.id, newFilename || p.img, cb);
        }*/
      if (img.indexOf('blank') == -1)
        uploadCtr.renameTo(img, imgPath, function () {
          cb(pl);
        });
      else cb(pl);
    });
  },
};

exports.handlePostRequest = async function (
  request,
  reqParams,
  response,
  features,
) {
  request.logToConsole('aoi.playlist.handleRequest', reqParams);

  // make sure a registered user is logged, or return an error page
  const user = await request.checkLogin(/*response*/);
  if (
    false == user ||
    !reqParams ||
    !reqParams.action ||
    !exports.actions[reqParams.action]
  )
    return response.badRequest();

  reqParams.uId = user.id;
  reqParams.uNm = user.name;

  exports.actions[reqParams.action](
    reqParams,
    function (res, args) {
      console.log(reqParams, '=>', res);
      response.legacyRender(
        res,
        null,
        args || { 'content-type': 'application/json' },
      );
    },
    features,
  );
};

function fetchPlaylist(p, cb) {
  p = p || {};
  if (!p.id) return cb({ error: 'missing id parameter' });
  const playlists = [], // output of the function
    plIdSet = {},
    uidList = [];
  const plIds = (typeof p.id == 'object' && p.id.length ? p.id : [p.id]).map(
    function (_plId) {
      const plId = '' + _plId;
      plIdSet[plId] = {};
      uidList.push(plId.split('_')[0]);
      return plId;
    },
  );
  userModel.fetchMulti(
    { _id: { $in: uidList } },
    { fields: { name: 1, pl: 1 } },
    function (userList) {
      // populate userSet
      const userSet = {};
      for (const i in userList) userSet['' + userList[i]._id] = userList[i];
      // populate plIdSet
      for (const i in plIdSet) {
        const plId = i.split('_');
        const userPl = (userSet[plId[0]] || {}).pl || [];
        for (const j in userPl)
          if (userPl[j].id == plId[1]) plIdSet[i] = userPl[j];
      }
      // for each playlist, fetch number of tracks
      (function next(i) {
        if (i >= plIds.length) return cb(playlists);
        const plId = plIds[i].split('_');
        if (plId.length != 2) next(i + 1);
        else
          postModel.countPlaylistPosts(plId[0], plId[1], function (c) {
            playlists.push({
              id: '' + plIds[i],
              name: plIdSet[plIds[i]].name,
              uId: plId[0],
              uNm: (userSet[plId[0]] || {}).name,
              plId: plId[1],
              nbTracks: c,
            });
            next(i + 1);
          });
      })(0);
    },
  );
}

exports.controller = function (request, getParams, response, features) {
  getParams = getParams || {};
  getParams.id = getParams.id || getParams._1;
  request.logToConsole('apiPost.controller', getParams);
  if (request.method.toLowerCase() === 'post')
    exports.handlePostRequest(request, request.body, response, features);
  else if (getParams.id)
    fetchPlaylist(getParams, function (playlists) {
      response.renderJSON(playlists);
    });
  else response.badRequest();
};
