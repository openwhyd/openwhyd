// @ts-check
/**
 * api endpoint for posts
 * @author adrienjoly, whyd
 **/

const snip = require('../../snip.js');
const mongodb = require('../../models/mongodb.js');
const postModel = require('../../models/post.js');
const userModel = require('../../models/user.js');
const notifModel = require('../../models/notif.js');
const followModel = require('../../models/follow.js');
const commentModel = require('../../models/comment.js');
const analytics = require('../../models/analytics.js');
const lastFm = require('./lastFm.js').lastFm;

const sequencedParameters = { _1: 'pId', _2: 'action' }; //[null, "pId", "action"];

function getBrowserVersionFromUserAgent(ua) {
  // reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#Browser_Name
  const BROWSER_UA_REGEX = [
    /(openwhyd-electron)\/([^ $]+)/,
    /(Chrome)\/([^ $]+)/,
    /(Chromium)\/([^ $]+)/,
    /(Seamonkey)\/([^ $]+)/,
    /(OPR)\/([^ $]+)/,
    /; (MSIE) ([^ ;$]+);/,
    /(Opera)\/([^ $]+)/,
    /(Safari)\/([^ $]+)/,
    /(Firefox)\/([^ $]+)/,
  ];
  for (let i = 0; i < BROWSER_UA_REGEX.length; ++i) {
    const match = ua.match(BROWSER_UA_REGEX[i]);
    if (match) return match.slice(1, 3); // => [ browser_name, version ]
  }
}

function fetchSubscribedUsers(uidList, uid, cb) {
  followModel.fetch(
    { uId: uid, tId: { $in: uidList } },
    null,
    function (results) {
      const uidSet = {};
      for (const i in results) uidSet[results[i].tId] = results[i];
      cb(uidSet);
    },
  );
}

const publicActions = {
  lovers: function (p, callback) {
    postModel.fetchPostById(p.pId, function (post) {
      const lovers = [];
      if (post && post.lov)
        fetchSubscribedUsers(post.lov, p.uId, async function (subscrUidSet) {
          for (const i in post.lov) {
            lovers.push({
              id: /*"/u/"+*/ post.lov[i],
              // name: await userModel.fetchUserNameById(post.lov[i]), // added by fetchUserBios()
              subscribed: !!subscrUidSet[post.lov[i]],
            });
          }
          userModel.fetchUserBios(lovers, function () {
            console.log('lovers', lovers);
            callback(lovers);
          });
        });
      else callback(lovers);
    });
  },

  reposts: function (p, callback) {
    postModel.fetchPosts(
      { 'repost.pId': p.pId },
      null,
      null,
      function (results) {
        const reposts = [];
        if (results) {
          const repostUids = [];
          for (const i in results) repostUids.push(results[i].uId);
          fetchSubscribedUsers(
            repostUids,
            p.uId,
            async function (subscrUidSet) {
              for (const i in results) {
                reposts.push({
                  id: /*"/u/"+*/ results[i].uId,
                  // name: await userModel.fetchUserNameById(results[i].uId), // added by fetchUserBios()
                  subscribed: !!subscrUidSet[results[i].uId],
                });
              }
              userModel.fetchUserBios(reposts, function () {
                callback(reposts);
              });
            },
          );
        } else callback(reposts);
      },
    );
  },
};

exports.actions = {
  sendToUsers: notifModel.sendTrackToUsers,

  addComment: commentModel.insert,

  deleteComment: commentModel.delete,

  /**
   * Post/repost/edit a track.
   * @param httpRequestParams {{
   *  uId: string;
   *  uNm: string;
   *  text?: string;
   *  name: string;
   *  eId: string;
   *  ctx?: string;
   *  pId?: string;
   *  _id?: string;
   *  img?: string;
   *  src?: unknown;
   * }}
   * @param createPlaylist {import('../../domain/api/Features').CreatePlaylist}
   */
  insert: async function (httpRequestParams, callback, _, { createPlaylist }) {
    const postRequest = {
      uId: httpRequestParams.uId,
      uNm: httpRequestParams.uNm,
      text: httpRequestParams.text || '',
      // fields that will be ignored by rePost():
      name: httpRequestParams.name,
      eId: httpRequestParams.eId,
    };

    if (httpRequestParams.ctx) postRequest.ctx = httpRequestParams.ctx;

    function tryJsonParse(p) {
      try {
        return JSON.parse(p);
      } catch (e) {
        return null;
      }
    }

    async function actualInsert() {
      if (httpRequestParams.pId)
        postModel.rePost(httpRequestParams.pId, postRequest, callback);
      else {
        if (httpRequestParams._id) {
          // edit mode
          const existingPost = await new Promise((resolve) =>
            postModel.fetchPostById(httpRequestParams._id, resolve),
          );
          if (existingPost.uId !== postRequest.uId) {
            callback({ error: "updating another user's post is not allowed" });
            return;
          }
          postRequest._id = httpRequestParams._id;
        }

        if (httpRequestParams.img && httpRequestParams.img != 'null')
          postRequest.img = httpRequestParams.img;

        if (httpRequestParams.src)
          // source webpage of the content: {id,name} provided by bookmarklet
          postRequest.src =
            typeof httpRequestParams.src == 'object'
              ? httpRequestParams.src
              : tryJsonParse(httpRequestParams.src);
        else if (httpRequestParams['src[id]'] && httpRequestParams['src[name]'])
          postRequest.src = {
            id: httpRequestParams['src[id]'],
            name: httpRequestParams['src[name]'],
          };
        if (!postRequest.src || !postRequest.src.id) delete postRequest.src;

        postModel.savePost(postRequest, callback);
      }
    }

    // Muter post avec la notion de playlist provenant des params
    // Clean code => Pure function
    const playlistRequest = extractPlaylistRequestFrom(httpRequestParams);

    if (needToCreatePlaylist(playlistRequest)) {
      postRequest.pl = await createPlaylist(
        httpRequestParams.uId,
        playlistRequest.name,
      );
    } else if (hasAValidPlaylistId(playlistRequest.id)) {
      postRequest.pl = {
        id: parseInt(playlistRequest.id, 10),
        name: playlistRequest.name,
      };
    }

    actualInsert();
  },
  delete: function (p, callback) {
    if (p.uId) {
      postModel.deletePost(p._id, p.uId, function (err, result) {
        callback(err ? { error: err } : (result || {}).pop ? result.pop() : {});
      });
    } else {
      callback({ error: 'please login first' });
    }
  },
  toggleLovePost: function (p, callback) {
    postModel.isPostLovedByUid(p.pId, p.uId, function (loved, post) {
      if (!post) callback({ loved: false, lovers: 0 });
      // to prevent crash when trying to love a repost
      else if (loved)
        postModel.unlovePost(p.pId, p.uId, function () {
          callback({ loved: false, lovers: (post.lov || [1]).length - 1 });
        });
      else
        postModel.lovePost(p.pId, p.uId, function () {
          callback({
            loved: true,
            lovers: (post.lov || []).length + 1,
            post: post,
          });
        });
    });
  },
  incrPlayCounter: function (p, cb, request) {
    // TODO: prevent a user from sending many calls in a row
    if (!p.uId) return cb && cb({ error: 'not logged in' });
    if (!p.pId || !mongodb.isObjectId(p.pId))
      // FYI: an old iOS version was sending a "(null)" value
      return cb && cb({ error: 'invalid pId' });
    p.logData = p.logData || {};
    function getShortUserAgent() {
      const userAgent =
        request && request.headers && request.headers['user-agent'];
      return userAgent ? getBrowserVersionFromUserAgent(userAgent) : undefined;
    }
    function callbackAndLogPlay(post) {
      cb && cb({ result: post });
      if (!post || !post.name) return;
      const ua = getShortUserAgent();
      const anyBrowserExceptElectron = !ua || !/openwhyd-electron/.test(ua);
      analytics.addPlay({
        eId: post.eId,
        pId: '' + post._id,
        uId: p.uId,
        own: p.uId == post.uId,
        err: p.logData.err,
        fbk: p.logData.fbk,
        ua: ua,
        foc: anyBrowserExceptElectron ? p.logData.foc : undefined, // result of document.hasFocus(), for https://github.com/openwhyd/openwhyd/issues/88#issuecomment-341404204
      });
      if (p.duration > 0) post.duration = p.duration;
      if (!p.logData.err) {
        userModel.fetchAndProcessUserById(p.uId).then((user) => {
          // @ts-ignore
          const lastFmSessionKey = user && user.lastFm ? user.lastFm.sk : null;
          lastFm.updateNowPlaying2(post, lastFmSessionKey, function () {
            //console.log("-> last fm response", res);
          });
        });
      }
    }
    if (p.logData.err) postModel.fetchPostById(p.pId, callbackAndLogPlay);
    else postModel.incrPlayCounter(p.pId, callbackAndLogPlay);
  },
  scrobble: function (p, cb) {
    if (!p.uId) return cb && cb({ error: 'not logged in' });
    postModel.fetchPostById(p.pId, function (r) {
      if (!r) return cb && cb({ error: 'missing track' });
      userModel.fetchAndProcessUserById(p.uId).then((user) => {
        // @ts-ignore
        const lastFmSessionKey = user && user.lastFm ? user.lastFm.sk : null;
        lastFm.scrobble2(
          r && r.name,
          lastFmSessionKey,
          p.uId == r.uId,
          p.timestamp,
          function (res) {
            //console.log("-> last fm response", res);
            cb && cb(res);
          },
        );
      });
    });
  },
};

/**
 * @param reqParams {{ uId: string; uNm: string; action: string; name: string; eId: string }}
 * @param features {import('../../domain/api/Features').Features}
 */
exports.handleRequest = async function (
  request,
  reqParams,
  response,
  features,
) {
  request.logToConsole('api.post.handleRequest', reqParams);

  function resultHandler(res, args) {
    response.legacyRender(
      res,
      null,
      args || { 'content-type': 'application/json' },
      (res || {}).error ? 400 : 200, // note: it would be better to return a 404 when post is not found
    );
  }

  const user = (await request.getUser()) || {};
  reqParams.uId = user.id;
  reqParams.uNm = user.name;

  if (reqParams.action && publicActions[reqParams.action])
    return publicActions[reqParams.action](reqParams, resultHandler);

  // make sure a registered user is logged, or return an error page
  if (!user || !user.id) return response.badRequest();

  if (reqParams.action && exports.actions[reqParams.action])
    exports.actions[reqParams.action](
      reqParams,
      resultHandler,
      request,
      features,
    );
  else response.badRequest();
};

/**
 * @param features {import('../../domain/api/Features').Features}
 */
exports.controller = async function (request, getParams, response, features) {
  //request.logToConsole("api.post", getParams);
  const params = snip.translateFields(getParams || {}, sequencedParameters);

  //if (request.method.toLowerCase() === 'post')
  for (const i in request.body) params[i] = request.body[i];

  exports.handleRequest(request, params, response, features);
};

function hasAValidPlaylistId(id) {
  return parseInt(id) >= 0;
}

function needToCreatePlaylist(playlistRequest) {
  return playlistRequest.id == 'create';
}

function extractPlaylistRequestFrom(httpRequestParams) {
  // Attention double responsabilité: parsing et mapping
  try {
    return typeof httpRequestParams.pl == 'object'
      ? httpRequestParams.pl
      : JSON.parse(httpRequestParams.pl);
  } catch (e) {
    return {
      id: httpRequestParams['pl[id]'],
      name: httpRequestParams['pl[name]'],
    };
  }
}
