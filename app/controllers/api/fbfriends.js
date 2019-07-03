/**
 * fbfriends controller
 * extract the user's list of facebook friends, and detect which ones are registered on whyd
 *
 * DEPRECATED => will return a dummy object with empty arrays, to not crash
 * clients that may still use the corresponding API endpoints.
 *
 * @author adrienjoly, whyd
 */

var https = require('https');
var facebookModel = require('../../models/facebook.js');

exports.handleRequest = function(request, reqParams, response) {
  request.logToConsole('fbfriends.handleRequest', reqParams);
  reqParams = reqParams || {};

  var loggedUser = request.checkLogin();
  if (!loggedUser) return response.legacyRender({ error: 'must be logged in' });

  facebookModel.fetchAccessToken(loggedUser.id, function(fbTok) {
    console.log('fbTok in db + param', fbTok, reqParams.fbAccessToken);

    if (reqParams.fetchUsersToInvite) {
      facebookModel.fetchCachedFriends(loggedUser.id, fbTok, function(
        fbfriends
      ) {
        var list = (fbfriends || {}).notOnWhyd || [];
        response.legacyRender({ fbfriends: list });
      });
    } else
      facebookModel.fetchFbFriendsWithSub(
        loggedUser,
        reqParams.fbAccessToken || fbTok,
        function(result) {
          response.legacyRender(result);
        }
      );
  });
};

exports.controller = function(request, getParams, response) {
  if (request.method.toLowerCase() === 'post')
    exports.handleRequest(request, request.body, response);
  else exports.handleRequest(request, getParams, response);
};
