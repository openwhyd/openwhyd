// const userLibrary = require('./userLibrary');

var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');

exports.controller = function (request, reqParams, response) {
  // return userLibrary.controller(request, reqParams, response);

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
