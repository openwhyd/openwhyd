// A private controller for Cypress to be able to reset the database between tests

const mongodb = require('../../models/mongodb.js');

exports.controller = async function(request, getParams, response) {
  request.logToConsole('resetDb.controller', request.method);
  if (request.method.toLowerCase() !== 'post') {
    return response.badRequest();
  }
  if (process.appParams.mongoDbDatabase !== 'openwhyd_test') {
    return response.forbidden(new Error('allowed on test database only'));
  }
  await mongodb.resetDb({ addTestData: true });
  response.renderJSON({ ok: true });
};
