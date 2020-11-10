/**
 * userLibrary controller
 * shows an organized view of posts (user's and friends' library)
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var analytics = require('../models/analytics.js');
var feedTemplate = require('../templates/feed.js');
var errorTemplate = require('../templates/error.js');
var loggingTemplate = require('../templates/logging.js');

var renderAllLibrary = require('./LibAll.js').render;
var renderUserLibrary = require('./LibUser.js').render;
var renderFriendsLibrary = require('./LibFriends.js').render;

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
  'embedW',
  'format',
  'pageUrl',
  'callback',
].concat(tabParams);

function LibraryController(reqParams, render) {
  reqParams = reqParams || {};
  this.render = render;
  this.options = {
    loggedUser:
      reqParams.loggedUser ||
      {} /*,
		after: reqParams.after,
		before: reqParams.before,
		limit: reqParams.limit,
		playlistId: reqParams.playlistId,
		showPlaylists: reqParams.showPlaylists,
		showLikes: reqParams.showLikes,
		embedW: reqParams.embedW,
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
  if (!this.options.embedW) {
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
  } else {
    this.render({ html: feedTemplate.renderFeedEmbed(feedHtml, this.options) });
  }
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
  reqParams.welcome = reqParams.welcome || path.endsWith('/welcome');

  function render(data, mimeType) {
    if (mimeType)
      return response.legacyRender(data, null, { 'content-type': mimeType });
    data = data || {
      error:
        'Nothing to render! Please send the URL of this page to ' +
        process.appParams.feedbackEmail,
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
      // console.log('rendering done!');
      if (
        loggedInUser &&
        loggedInUser.id &&
        !reqParams.after &&
        !reqParams.before
      )
        analytics.addVisit(loggedInUser, request.url /*"/u/"+uid*/);
    } else if (typeof data == 'object') response.renderJSON(data.json || data);
    else response.legacyRender(data.error);
  }

  var lib = new LibraryController(reqParams, render);

  function redirectTo(path) {
    var paramsObj = {},
      paramsToKeep = [
        'after',
        'before',
        'embedW',
        'format',
        'limit',
        'callback',
      ];
    for (let i in paramsToKeep)
      if (reqParams[paramsToKeep[i]])
        paramsObj[paramsToKeep[i]] = reqParams[paramsToKeep[i]];
    response.temporaryRedirect(path, paramsObj);
  }

  //if (path == "/welcome")
  //	response.temporaryRedirect("/stream?welcome=1", reqParams);

  if (
    path == '/' ||
    request.url.indexOf('/stream') > -1 ||
    request.url.indexOf('/welcome') > -1
  ) {
    if (loggedInUser && loggedInUser.id) return renderFriendsLibrary(lib);
    else if (reqParams.format == 'json')
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
              user.handle ? '/' + user.handle : '/u/' + reqParams.id
            )
          );
      });
  } else if (path == '/all') {
    return renderAllLibrary(lib);
  } else if (reqParams.playlistId) {
    // temporarily reversed redirection logic
    // FROM /u/id/playlist/xxx -> /handle/playlist/xxx TO /handle/playlist/xxx -> /u/id/playlist/xxx
    // so that every fb-likable page always have the same URL (for 2012 playlist contest)

    if (reqParams.handle)
      userModel.fetchByHandle(reqParams.handle, function (user) {
        if (user)
          redirectTo(path.replace('/' + reqParams.handle, '/u/' + user._id));
        else render({ errorCode: 'USER_NOT_FOUND' });
      });
    else if (reqParams.id)
      userModel.fetchByUid(reqParams.id, function (user) {
        renderUserLibrary(lib, user);
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
      else if (user.handle && !reqParams.embedW)
        redirectTo(path.replace('/u/' + reqParams.id, '/' + user.handle));
      else renderUserLibrary(lib, user);
    });
  } else response.badRequest();
};
