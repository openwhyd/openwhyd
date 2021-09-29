const userLibraryController = require('./userLibrary');

exports.controller = function (request, reqParams, response) {
  response.send('');
  // TODO: return userLibraryController(request, reqParams, response);
};

// To run tests:
// docker-compose up --build --detach web && sleep 5 && WHYD_GENUINE_SIGNUP_SECRET="whatever" npx ava test/approval.tests.js
