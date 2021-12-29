// A private controller for Cypress to be able to reset the database between tests

const mongodb = require('../../models/mongodb.js');

exports.controller = async function (request, getParams, response) {
  // Important: After calling this `/testing/reset` route, other pending HTTP requests may never return.
  request.logToConsole('reset.controller', request.method);
  if (request.method.toLowerCase() !== 'post') {
    return response.badRequest();
  }
  if (process.appParams.mongoDbDatabase !== 'openwhyd_test') {
    return response.forbidden(new Error('allowed on test database only'));
  }
  try {
    await mongodb.clearCollections();
    await mongodb.initCollections({ addTestData: true });
    response.renderJSON({ ok: true });
  } catch (err) {
    response.renderJSON({ error: err.message });
  }
};
