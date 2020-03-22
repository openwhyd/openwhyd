// A private controller for Cypress to be able to reset the database between tests

exports.controller = async function(request, getParams, response) {
  request.logToConsole('testing.restart.controller', request.method);
  if (request.method.toLowerCase() !== 'post') {
    return response.badRequest();
  }
  if (process.appParams.mongoDbDatabase !== 'openwhyd_test') {
    return response.forbidden(new Error('allowed on test environment only'));
  }
  response.renderJSON({ ok: 1 });
  process.exit(254); // docker-compose will restart the server
};
