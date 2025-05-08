//@ts-check

/**
 * userLibrary controller
 * shows an organized view of posts (user's and friends' library)
 * @author adrienjoly, whyd
 **/

const mongodb = require('../models/mongodb.js');
const userModel = require('../models/user.js');
const feedTemplate = require('../templates/feed.js');
const errorTemplate = require('../templates/error.js');
const loggingTemplate = require('../templates/logging.js');

const renderAllLibrary = require('./LibAll.js').render;
const renderUserLibrary = require('./LibUser.js').render;
const renderFriendsLibrary = require('./LibFriends.js').render;

const tabParams = [
  'showPlaylists',
  'showLikes',
  'showActivity',
  'showSubscribers',
  'showSubscriptions',
];
const paramsToInclude = [
  'after',
  'before',
  'limit',
  'playlistId',
  'embedW',
  'format',
  'pageUrl',
  'wholePage',
  'callback',
].concat(tabParams);

function LibraryController(reqParams, render) {
  reqParams = reqParams || {};
  this.render = render;
  /** @type import('./LibUser.js').FetchAndRenderOptions */
  this.options = {
    loggedUser: reqParams.loggedUser || {},
  };
  for (const paramName of paramsToInclude) {
    const value = reqParams[paramName];
    if (typeof value === 'object')
      throw new Error(`invalid parameter value: ${paramName}`);
    this.options[paramName] = value;
  }
  if (typeof this.options.limit == 'string')
    this.options.limit = parseInt(this.options.limit);
  if (this.options.callback) this.options.format = 'json';
}

LibraryController.prototype.renderPage = function (
  user,
  sidebarHtml,
  feedHtml,
) {
  if (!this.options.embedW) {
    this.options.content = feedHtml;
    let html = feedTemplate.renderFeedPage(user, this.options);
    const loggedUserId = (this.options.loggedUser || {}).id;
    if (loggedUserId) {
      userModel.fetchByUid(loggedUserId, (user) => {
        if (user && !user.consent) {
          const thisUrl = encodeURIComponent(this.options.pageUrl || '/');
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

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('userLibrary.controller', reqParams);

  reqParams = reqParams || {};
  const loggedInUser = (reqParams.loggedUser = (await request.getUser()) || {});
  if (loggedInUser && loggedInUser.id)
    reqParams.loggedUser.isAdmin = request.isUserAdmin(loggedInUser);

  const path = request.url.split('?')[0];
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
        loggedInUser,
      );
    } else if (data.error) {
      console.error('userLibrary ERROR: ', data.error);
      //response.renderHTML(errorTemplate.renderErrorMessage(data.error));
      errorTemplate.renderErrorResponse(
        data,
        response,
        reqParams.format,
        loggedInUser,
      );
    } else if (data.html) {
      response.renderHTML(data.html);
    } else if (typeof data == 'object') response.renderJSON(data.json || data);
    else response.legacyRender(data.error);
  }

  let lib;
  try {
    lib = new LibraryController(reqParams, render);
  } catch (err) {
    response.badRequest({ error: err.message });
    return;
  }

  function redirectTo(path) {
    const paramsObj = {},
      paramsToKeep = [
        'after',
        'before',
        'embedW',
        'format',
        'limit',
        'wholePage',
        'callback',
      ];
    for (const i in paramsToKeep)
      if (reqParams[paramsToKeep[i]])
        paramsObj[paramsToKeep[i]] = reqParams[paramsToKeep[i]];
    response.temporaryRedirect(path, paramsObj);
  }

  if (path == '/' || request.url.indexOf('/stream') > -1) {
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
              user.handle ? '/' + user.handle : '/u/' + user.id,
            ),
          );
      });
  } else if (path == '/all') {
    return renderAllLibrary(lib);
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
  } else {
    response.badRequest();
  }
};
