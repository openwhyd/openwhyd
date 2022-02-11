/**
 * api endpoint for posts
 * @author adrienjoly, whyd
 **/

var snip = require('../../snip.js');
var mongodb = require('../../models/mongodb.js');
var postModel = require('../../models/post.js');
var userModel = require('../../models/user.js');
var commentModel = require('../../models/comment.js');
var lastFm = require('./lastFm.js').lastFm;

var sequencedParameters = { _1: 'pId', _2: 'action' }; //[null, "pId", "action"];

function getBrowserVersionFromUserAgent(ua) {
  // reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent#Browser_Name
  var BROWSER_UA_REGEX = [
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
    var match = ua.match(BROWSER_UA_REGEX[i]);
    if (match) return match.slice(1, 3); // => [ browser_name, version ]
  }
}

var publicActions = {
  lovers: function (p, callback) {
    postModel.fetchPostById(p.pId, function (post) {
      var lovers = [];
      callback(lovers);
    });
  },

  reposts: function (p, callback) {
    postModel.fetchPosts(
      { 'repost.pId': p.pId },
      null,
      null,
      function (results) {
        var reposts = [];
        callback(reposts);
      }
    );
  },
};

exports.actions = {
  addComment: commentModel.insert,

  deleteComment: commentModel.delete,

  insert: function (p, callback) {
    var q = {
      uId: p.uId,
      uNm: p.uNm,
      text: p.text || '',
      pl: undefined, // to be parsed/populated before calling actualInsert()
      // fields that will be ignored by rePost():
      name: p.name,
      eId: p.eId,
    };

    if (p.ctx) q.ctx = p.ctx;

    function tryJsonParse(p) {
      try {
        return JSON.parse(p);
      } catch (e) {
        return null;
      }
    }

    function actualInsert() {
      if (p.pId) postModel.rePost(p.pId, q, callback);
      else {
        if (p._id)
          // edit mode
          q._id = p._id;

        if (p.img && p.img != 'null') q.img = p.img;

        if (p.src)
          // source webpage of the content: {id,name} provided by bookmarklet
          q.src = typeof p.src == 'object' ? p.src : tryJsonParse(p.src);
        else if (p['src[id]'] && p['src[name]'])
          q.src = {
            id: p['src[id]'],
            name: p['src[name]'],
          };
        if (!q.src || !q.src.id) delete q.src;

        postModel.savePost(q, callback);
      }
    }

    // process playlist
    try {
      q.pl = typeof p.pl == 'object' ? p.pl : JSON.parse(p.pl);
    } catch (e) {
      q.pl = {
        id: p['pl[id]'],
        name: p['pl[name]'],
      };
    }
    if (q.pl.id == 'create') {
      userModel.createPlaylist(p.uId, q.pl.name, function (playlist) {
        if (playlist) {
          q.pl.id = playlist.id;
          // console.log('playlist was created', q.pl);
        }
        actualInsert();
      });
      return; // avoid inserting twice
    } else {
      q.pl.id = parseInt(q.pl.id);
      if (isNaN(q.pl.id)) delete q.pl; //q.pl = null;
    }

    actualInsert();
  },
  delete: function (p, callback) {
    postModel.deletePost(
      p._id,
      function (result) {
        callback((result || {}).pop ? result.pop() : {});
      },
      p.uId
    );
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
    if (mongodb.ObjectId('' + p.pId) === 'invalid_id') {
      // FYI: an old iOS version was sending a "(null)" value
      console.log(
        'warning: skipping invalid pId value in incrPlayCounter:',
        typeof p.pId,
        p.pId
      );
      console.log('from user agent: ', getShortUserAgent());
      return cb && cb({ error: 'invalid pId' });
    }
    p.logData = p.logData || {};
    function getShortUserAgent() {
      var userAgent =
        request && request.headers && request.headers['user-agent'];
      return userAgent ? getBrowserVersionFromUserAgent(userAgent) : undefined;
    }
    function callbackAndLogPlay(post) {
      cb && cb({ result: post });
      if (!post || !post.name) return;
      if (p.duration > 0) post.duration = p.duration;
      if (!p.logData.err)
        lastFm.updateNowPlaying2(
          post,
          (mongodb.usernames[p.uId].lastFm || {}).sk,
          function () {
            //console.log("-> last fm response", res);
          }
        );
    }
    if (p.logData.err) postModel.fetchPostById(p.pId, callbackAndLogPlay);
    else postModel.incrPlayCounter(p.pId, callbackAndLogPlay);
  },
  scrobble: function (p, cb) {
    if (!p.uId) return cb && cb({ error: 'not logged in' });
    postModel.fetchPostById(p.pId, function (r) {
      if (!r) return cb && cb({ error: 'missing track' });
      var lastFmSessionKey = (mongodb.usernames[p.uId].lastFm || {}).sk;
      lastFm.scrobble2(
        r && r.name,
        lastFmSessionKey,
        p.uId == r.uId,
        p.timestamp,
        function (res) {
          //console.log("-> last fm response", res);
          cb && cb(res);
        }
      );
    });
  },
};

exports.handleRequest = function (request, reqParams, response) {
  request.logToConsole('api.post.handleRequest', reqParams);

  function resultHandler(res, args) {
    if (!res || res.error)
      console.log(
        /*reqParams,*/ 'api.post.' + reqParams.action,
        ' RESULT =>',
        res
      );
    response.legacyRender(
      res,
      null,
      args || { 'content-type': 'application/json' }
    );
  }

  var user = request.getUser() || {}; //checkLogin(response);
  reqParams.uId = user.id;
  reqParams.uNm = user.name;

  if (reqParams.action && publicActions[reqParams.action])
    return publicActions[reqParams.action](reqParams, resultHandler);

  // make sure a registered user is logged, or return an error page
  if (!user || !user.id) return response.badRequest();

  if (reqParams.action && exports.actions[reqParams.action])
    exports.actions[reqParams.action](reqParams, resultHandler, request);
  else response.badRequest();
};

exports.controller = function (request, getParams, response) {
  //request.logToConsole("api.post", getParams);
  var params = snip.translateFields(getParams || {}, sequencedParameters);

  //if (request.method.toLowerCase() === 'post')
  for (let i in request.body) params[i] = request.body[i];

  exports.handleRequest(request, params, response);
};
