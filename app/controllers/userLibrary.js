/**
 * userLibrary controller
 * shows an organized view of posts (user's and friends' library)
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var feedTemplate = require('../templates/feed.js');
var errorTemplate = require('../templates/error.js');
var loggingTemplate = require('../templates/logging.js');

var renderAllLibrary = require('./LibAll.js').render;
var renderUserLibrary = require('./LibUser.js').render;

var tabParams = [
  'showPlaylists',
  'showLikes',
  'showActivity',
  'showSubscribers',
  'showSubscriptions',
];
var paramsToInclude = [
  'after',
  'before',
  'limit',
  'playlistId',
  'format',
  'pageUrl',
  'wholePage',
  'callback',
].concat(tabParams);

function LibraryController(reqParams, render) {
  reqParams = reqParams || {};
  this.render = render;
  this.options = {
    loggedUser: reqParams.loggedUser || {} /*,
		after: reqParams.after,
		before: reqParams.before,
		limit: reqParams.limit,
		playlistId: reqParams.playlistId,
		showPlaylists: reqParams.showPlaylists,
		showLikes: reqParams.showLikes,
		format: reqParams.format,
		pageUrl: reqParams.pageUrl*/,
  };
  for (let i in paramsToInclude)
    this.options[paramsToInclude[i]] = reqParams[paramsToInclude[i]];
  if (typeof this.options.limit == 'string')
    this.options.limit = parseInt(this.options.limit);
  if (this.options.callback) this.options.format = 'json';
}

LibraryController.prototype.renderPage = function (
  user,
  sidebarHtml,
  feedHtml
) {
  this.options.content = feedHtml;
  let html = feedTemplate.renderFeedPage(user, this.options);
  var loggedUserId = (this.options.loggedUser || {}).id;
  if (loggedUserId) {
    userModel.fetchByUid(loggedUserId, (user) => {
      if (user && !user.consent) {
        var thisUrl = encodeURIComponent(this.options.pageUrl || '/');
        html = loggingTemplate.htmlRedirect('/consent?redirect=' + thisUrl);
      }
      this.render({ html });
    });
  } else this.render({ html });
};

LibraryController.prototype.renderJson = function (json) {
  this.render({ json });
};

LibraryController.prototype.renderOther = function (data, mimeType) {
  this.render(data, mimeType);
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('userLibrary.controller', reqParams);

  reqParams = reqParams || {};
  var loggedInUser = (reqParams.loggedUser = request.getUser() || {});
  if (loggedInUser && loggedInUser.id)
    reqParams.loggedUser.isAdmin = request.isUserAdmin(loggedInUser);

  var path = request.url.split('?')[0];
  //console.log("path", path)
  reqParams.showPlaylists = path.endsWith('/playlists');
  reqParams.showLikes = path.endsWith('/likes');
  reqParams.showActivity = path.endsWith('/activity');
  reqParams.showSubscribers = path.endsWith('/subscribers');
  reqParams.showSubscriptions = path.endsWith('/subscriptions');
  reqParams.pageUrl = request.url;

  function render(data, mimeType) {
    if (mimeType)
      return response.legacyRender(data, null, { 'content-type': mimeType });
    data = data || {
      error: 'Nothing to render!',
    };
    if (data.errorCode) {
      //response.renderHTML(errorTemplate.renderErrorCode(data.errorCode));
      errorTemplate.renderErrorResponse(
        data,
        response,
        reqParams.format,
        loggedInUser
      );
    } else if (data.error) {
      console.error('userLibrary ERROR: ', data.error);
      //response.renderHTML(errorTemplate.renderErrorMessage(data.error));
      errorTemplate.renderErrorResponse(
        data,
        response,
        reqParams.format,
        loggedInUser
      );
    } else if (data.html) {
      response.renderHTML(data.html);
    } else if (typeof data == 'object') response.renderJSON(data.json || data);
    else response.legacyRender(data.error);
  }

  var lib = new LibraryController(reqParams, render);

  function redirectTo(path) {
    var paramsObj = {},
      paramsToKeep = [
        'after',
        'before',
        'format',
        'limit',
        'wholePage',
        'callback',
      ];
    for (let i in paramsToKeep)
      if (reqParams[paramsToKeep[i]])
        paramsObj[paramsToKeep[i]] = reqParams[paramsToKeep[i]];
    response.temporaryRedirect(path, paramsObj);
  }

  if (path == '/' || request.url.indexOf('/stream') > -1) {
    if (loggedInUser && loggedInUser.id) {
      lib.options.bodyClass = 'home';
      return renderAllLibrary(lib);
    } else if (reqParams.format == 'json')
      return render({ errorCode: 'REQ_LOGIN' });
    else {
      lib.options.bodyClass = 'home';
      return renderAllLibrary(lib);
    }
  } else if (path == '/me') {
    if (request.checkLogin(response, reqParams.format))
      userModel.fetchByUid(loggedInUser.id, function (user) {
        if (!user) render({ errorCode: 'USER_NOT_FOUND' });
        else
          redirectTo(
            path.replace(
              '/me',
              user.handle ? '/' + user.handle : '/u/' + user.id
            )
          );
      });
  } else if (reqParams.handle)
    userModel.fetchByHandle(reqParams.handle, function (user) {
      renderUserLibrary(lib, user);
    });
  else if (reqParams.id) {
    if (!mongodb.isObjectId(reqParams.id))
      return render({ errorCode: 'USER_NOT_FOUND' });
    userModel.fetchByUid(reqParams.id, function (user) {
      if (!user) render({ errorCode: 'USER_NOT_FOUND' });
      else if (user.handle)
        redirectTo(path.replace('/u/' + reqParams.id, '/' + user.handle));
      else renderUserLibrary(lib, user);
    });
  } else {
    response.badRequest();
  }
};
