/**
 * facebook model
 * method to make requests to FB's Graph API
 * @author adrienjoly, whyd
 */

var https = require('https');
var userModel = require('./user.js');
var querystring = require('querystring');

var host = 'graph.facebook.com';

const DUMMY_FBFRIENDS = {
  whydFriends: [],
  notOnWhyd: [],
  userSubscriptions: {
    subscriptions: [],
  },
};

exports.fetchAccessToken = function (uId, cb) {
  userModel.fetchByUid(uId, function (user) {
    cb((user || {}).fbTok);
  });
};

exports.graphApiRequest = function (fbAccessToken, path, params, handler) {
  console.log('facebookModel.graphApiRequest', path, '...');
  params = params || {};
  //var url = path + "?method=GET&metadata=" + !!params.metadata + "&format=json&access_token=" + fbAccessToken;
  params.format = params.format || 'json';
  params.access_token = fbAccessToken;
  params.metadata = !!params.metadata;
  params.method = params.method || 'GET';
  var url = path + '?' + querystring.stringify(params);
  https
    .request(
      { path: url, host: host, port: 443, method: params.method },
      function (res) {
        res.addListener('error', function (err) {
          console.log('facebook request error: ', err);
          if (handler) handler({ error: err });
        });
        var json = '';
        res.addListener('data', function (chunk) {
          json += chunk.toString();
        });
        res.addListener('end', function () {
          //console.log("facebookModel.graphApiRequest =>", json);
          try {
            json = JSON.parse(json);
            if (json && json.error)
              console.log(
                'facebookModel.graphApiRequest => ERROR:',
                json.error,
              );
            //var results = (json || {}).data || [];
            handler(json);
          } catch (e) {
            handler();
          }
        });
      },
    )
    .on('error', function (err) {
      console.log('[ERR] facebook.graphApiRequest ', err);
      console.error('[ERR] facebook.graphApiRequest ', err);
      handler({ error: err });
    })
    .end();
};

exports.fetchMe = function (fbAccessToken, handler) {
  exports.graphApiRequest(fbAccessToken, '/me', {}, function (json) {
    //console.log("facebookModel.fetchMe => json: ", Object.keys(json || {}));
    var fbUser = (json || {}).data || json;
    //console.log("facebookModel.fetchMe => fbUser: ", fbUser);
    handler(fbUser);
  });
};

exports.fetchFbFriendsWithSub = function (loggedUser, fbTok, cb) {
  cb(DUMMY_FBFRIENDS);
};

exports.fetchCachedFriends = function (uId, fbTok, cb) {
  cb(DUMMY_FBFRIENDS);
};
