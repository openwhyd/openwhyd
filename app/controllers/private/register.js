// @ts-check

/**
 * register controller
 * register new users coming from the /invite form
 * @author adrienjoly, whyd
 */

const userModel = require('../../models/user.js');
const htmlRedirect = require('../../templates/logging.js').htmlRedirect;
const notifEmails = require('../../models/notifEmails.js');
const loggingTemplate = require('../../templates/logging.js');

function renderError(request, getParams, response, errorMsg) {
  const json = { error: errorMsg };
  response[getParams.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
    json,
  );
}

/**
 * Handler of API route used for user registration / signup.
 * @param {*} request
 * @param {*} getParams
 * @param {*} response
 * @param {{ auth: import('../../lib/my-http-wrapper/http/AuthFeatures.js').AuthFeatures }} features
 */
exports.controller = async function (request, getParams, response, features) {
  request.logToConsole('register.controller', request.method);
  const newUserFromAuth0 = features.auth?.getAuthenticatedUser(request);
  if (newUserFromAuth0) {
    /** @type {import('../../infrastructure/mongodb/types.js').UserDocument} */
    const existing = await new Promise((resolve) =>
      userModel.fetchByUid(newUserFromAuth0.id, resolve),
    );
    if (existing?.id) {
      console.log(
        `User signing up from Auth0 already exists in our database: ${existing.id}, handle: ${existing.handle}`,
      );
      response.renderHTML(htmlRedirect('/'));
      return;
    }
    console.log(
      `New user from Auth0, id: ${newUserFromAuth0.id}, handle: ${newUserFromAuth0.name}`,
    );
    // finalize user signup from Auth0, by persisting them into our database
    const storedUser = await new Promise(
      (resolve) => userModel.save(newUserFromAuth0, resolve),
      // TODO: save newUserFromAuth0.name as storedUser.handle?
    );
    if (storedUser) {
      console.log(
        `New user from Auth0, stored with _id: ${storedUser._id}, handle: ${storedUser.handle}`,
      );
      notifEmails.sendRegWelcomeAsync(storedUser);
      response.renderHTML(htmlRedirect('/')); // in reality, this ends up redirecting to the consent request page
    } else {
      console.error(`New user from Auth0, failed to be stored in db`);
      renderError(
        request,
        storedUser,
        response,
        'Oops, your registration failed... Please reach out to contact@openwhyd.org',
      );
    }
  } else {
    response.renderHTML(loggingTemplate.renderLoginPage());
  }
};
