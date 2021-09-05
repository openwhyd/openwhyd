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

/**
 * @param {{
 *   loggedUser: { id: unknown, isAdmin:boolean } | undefined
 *   showPlaylists: boolean
 *   showLikes: boolean
 *   showActivity: boolean
 *   showSubscribers: boolean
 *   showSubscriptions: boolean
 *   pageUrl: string
 *   format: 'json' | 'html'
 *   id: string | undefined
 *   handle: string | undefined
 *   embedW: unknown
 *   after: unknown
 *   before: unknown
 *   limit: unknown
 *   playlistId: unknown
 *   callback: unknown
 * }} reqParams
 * @param {*} render
 */
function LibraryController(reqParams, render) {
  this.render = render;
  this.options = {
    loggedUser: reqParams.loggedUser || {},

    showPlaylists: reqParams.showPlaylists,
    showLikes: reqParams.showLikes,
    showActivity: reqParams.showActivity,
    showSubscribers: reqParams.showSubscribers,
    showSubscriptions: reqParams.showSubscriptions,

    after: reqParams.after,
    before: reqParams.before,
    limit: reqParams.limit,
    playlistId: reqParams.playlistId,
    embedW: reqParams.embedW,
    format: reqParams.format,
    pageUrl: reqParams.pageUrl,
    callback: reqParams.callback,
  };
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

/**
 * @param {import('express').Request} request
 * @param {import('express').Request['query']} reqParams
 * @param {import('express').Response} response
 */
exports.controller = function (request, reqParams, response) {
  request.logToConsole('userLibrary.controller', reqParams);

  /** @type {{ id: unknown, isAdmin:boolean } | undefined} */
  var loggedInUser = reqParams.loggedUser || request.getUser() || {};
  if (loggedInUser && loggedInUser.id)
    loggedInUser.isAdmin = request.isUserAdmin(loggedInUser);

  var path = request.url.split('?')[0];

  /** @type {{
   *    loggedUser: { id: unknown, isAdmin:boolean } | undefined
   *    showPlaylists: boolean
   *    showLikes: boolean
   *    showActivity: boolean
   *    showSubscribers: boolean
   *    showSubscriptions: boolean
   *    pageUrl: string
   *    format: 'json' | 'html'
   *    id: string | undefined
   *    handle: string | undefined
   *    embedW: unknown
   *   after: unknown
   *   before: unknown
   *   limit: unknown
   *   playlistId: unknown
   *   callback: unknown
   *  }} */
  const params = {
    loggedUser: loggedInUser,
    showPlaylists: path.endsWith('/playlists'),
    showLikes: path.endsWith('/likes'),
    showActivity: path.endsWith('/activity'),
    showSubscribers: path.endsWith('/subscribers'),
    showSubscriptions: path.endsWith('/subscriptions'),
    pageUrl: request.url,
    format: reqParams.format == 'json' ? 'json' : 'html',
    id: typeof reqParams.id === 'string' ? reqParams.id : undefined, // user id of the profile to display
    handle: typeof reqParams.handle === 'string' ? reqParams.handle : undefined, // user handle of the profile to display
    embedW: reqParams.embedW, // width of the embedded player to render, if requested
    after: reqParams.after,
    before: reqParams.before,
    limit: reqParams.limit,
    playlistId: reqParams.playlistId,
    callback: reqParams.callback,
  };

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
      if (loggedInUser && loggedInUser.id && !params.after && !params.before)
        analytics.addVisit(loggedInUser, request.url /*"/u/"+uid*/);
    } else if (typeof data == 'object') response.renderJSON(data.json || data);
    else response.legacyRender(data.error);
  }

  var lib = new LibraryController(params, render);

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

  if (path == '/' || request.url.indexOf('/stream') > -1) {
    if (loggedInUser && loggedInUser.id) return renderFriendsLibrary(lib);
    else if (params.format == 'json') return render({ errorCode: 'REQ_LOGIN' });
    else {
      lib.options.bodyClass = 'home';
      return renderAllLibrary(lib);
    }
  } else if (path == '/me') {
    if (request.checkLogin(response, params.format))
      userModel.fetchByUid(loggedInUser.id, function (user) {
        if (!user) render({ errorCode: 'USER_NOT_FOUND' });
        else
          redirectTo(
            path.replace(
              '/me',
              user.handle ? '/' + user.handle : '/u/' + params.id
            )
          );
      });
  } else if (path == '/all') {
    return renderAllLibrary(lib);
  } else if (params.handle)
    userModel.fetchByHandle(params.handle, function (user) {
      renderUserLibrary(lib, user);
    });
  else if (params.id) {
    if (!mongodb.isObjectId(params.id))
      return render({ errorCode: 'USER_NOT_FOUND' });
    userModel.fetchByUid(params.id, function (user) {
      if (!user) render({ errorCode: 'USER_NOT_FOUND' });
      else if (user.handle && !params.embedW)
        redirectTo(path.replace('/u/' + params.id, '/' + user.handle));
      else renderUserLibrary(lib, user);
    });
  } else {
    response.badRequest();
  }
};
