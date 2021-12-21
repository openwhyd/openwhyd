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
  response.renderJSON({ ok: true });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.warn(`[reset.controller] stopping server...`);
  process.appServer.stop(async (err) => {
    console.error(
      `[reset.controller] error when stopping server: ${err.message}`
    );
    console.warn(`[reset.controller] resetting db...`);
    await mongodb.clearCollections();
    console.warn(`[reset.controller] adding test data...`);
    await mongodb.initCollections({ addTestData: true });
    console.warn(`[reset.controller] restarting server...`);
    process.appServer.start(() => {
      console.warn(`[reset.controller] server is back online!`);
    });
  });
};
