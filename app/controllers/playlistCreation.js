const userLibrary = require('./userLibrary');

exports.controller = function (request, reqParams, response) {
  return userLibrary.controller(request, reqParams, response);
};

// To run tests:
// docker-compose stop web && docker-compose up --build --detach web && sleep 5 && WHYD_GENUINE_SIGNUP_SECRET="whatever" npx ava test/approval.tests.js
