// A private controller to refresh the user cache after users were inserted manually into the test db.

const mongodb = require('../../models/mongodb.js');

exports.controller = async function (request, getParams, response) {
  request.logToConsole('refresh.controller', request.method);
  if (request.method.toLowerCase() !== 'post') {
    return response.badRequest();
  }
  if (process.appParams.mongoDbDatabase !== 'openwhyd_test') {
    return response.forbidden(new Error('allowed on test database only'));
  }
  try {
    await mongodb.initCollections({ addTestData: false });
    response.renderJSON({ ok: true });
  } catch (err) {
    response.renderJSON({ error: err.message });
  }
};
