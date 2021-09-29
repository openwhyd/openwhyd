// const userLibrary = require('./userLibrary');

var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');

exports.controller = function (request, reqParams, response) {
  // return userLibrary.controller(request, reqParams, response);

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

  if (reqParams.id) {
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
