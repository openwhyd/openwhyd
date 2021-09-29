const userLibrary = require('./userLibrary');
const renderUserLibrary = require('./LibUser.js').render;
var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var analytics = require('../models/analytics.js');
var errorTemplate = require('../templates/error.js');

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
