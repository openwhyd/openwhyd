// A private controller for Cypress to be able to reset the database between tests

const mongodb = require('../../models/mongodb.js');
const { ImageStorage } = require('../../infrastructure/ImageStorage.js');

exports.controller = async function (request, getParams, response) {
  // Important: After calling this `/testing/reset` route, other pending HTTP requests may never return.
  request.logToConsole('reset.controller', request.method);
  if (request.method.toLowerCase() !== 'post') {
    return response.badRequest();
  }
  if (!process.appParams.isOnTestDatabase) {
    return response.forbidden(new Error('allowed on test database only'));
  }
  try {
    // reinitialize database state
    await mongodb.clearCollections();
    await mongodb.initCollections({ addTestData: true });

    // delete uploaded files
    await new ImageStorage().deleteAllFiles();

    response.renderJSON({ ok: true });
  } catch (err) {
    response.renderJSON({ error: err.message });
  }
};
