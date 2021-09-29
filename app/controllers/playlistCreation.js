const userLibrary = require('./userLibrary');
const {
  renderUserLinks,
  generateMixpanelCode,
  fetchAndRender,
  fetchPlaylists,
  fetchStats,
  fetchLikes,
  fetchNbTracks,
} = require('./LibUser');
const config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var analytics = require('../models/analytics.js');
var errorTemplate = require('../templates/error.js');

function renderUserLibrary(lib, user) {
  var options = lib.options;

  if (user == null) return lib.render({ errorCode: 'USER_NOT_FOUND' });

  options.pageUrl = options.pageUrl.replace(
    '/' + user.handle,
    '/u/' + user._id
  );

  options.uid = '' + user._id;
  options.user = user;
  options.displayPlaylistName = !options.playlistId;

  if (options.user && options.user.lnk) renderUserLinks(options.user.lnk);

  function renderResponse(feed) {
    if (options.callback) {
      var safeCallback = options.callback.replace(/[^a-z0-9_]/gi, '');
      lib.renderOther(
        safeCallback + '(' + JSON.stringify(feed) + ')',
        'application/javascript'
      );
    } else if (options.format == 'links') {
      lib.renderOther(
        feed
          .map(function (p) {
            return config.translateEidToUrl((p || {}).eId);
          })
          .join('\n'),
        'text/text'
      );
    } else if (options.showPlaylists && options.format == 'json') {
      lib.renderJson(options.playlists);
    } else if (options.format == 'json') {
      lib.renderJson(feed);
    } else if (options.after || options.before) {
      lib.render({ html: feed });
    } else
      lib.renderPage(
        user,
        null /*sidebarHtml*/,
        generateMixpanelCode(options) + feed
      );
  }

  // add final rendering functions at queue of the call chain
  var fcts = [fetchAndRender, renderResponse];

  // prepend required fetching operations in head of the call chain
  if (!options.after && !options.before)
    // main tab: tracks (full layout to render, with sidebar)
    fcts = [
      fetchPlaylists,
      /*fetchSubscriptions,*/ fetchStats,
      fetchLikes,
      fetchNbTracks /*fetchSimilarity*/,
    ].concat(fcts);
  //if (options.showSubscribers || options.showSubscriptions || options.showActivity)
  //	fcts = [fetchSubscriptions].concat(fcts);

  // run the call chain
  (function next(res) {
    var fct = fcts.shift();
    //console.time(fct.name);
    fct(res || options, function (res) {
      //console.timeEnd(fct.name);
      next(res || options);
    });
  })();
}

exports.controller = function (request, reqParams, response) {
  // return userLibrary.controller(request, reqParams, response);

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

  const loggedInUser = (reqParams.loggedUser = request.getUser() || {});

  reqParams.playlistId = 'create';
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

  const lib = new userLibrary.LibraryController(reqParams, render);

  if (reqParams.handle)
    userModel.fetchByHandle(reqParams.handle, function (user) {
      renderUserLibrary(lib, user);
    });
  else if (reqParams.id) {
    const path = request.url.split('?')[0];
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

// To run tests:
// docker-compose stop web && docker-compose up --build --detach web && sleep 5 && WHYD_GENUINE_SIGNUP_SECRET="whatever" npx ava test/approval.tests.js
