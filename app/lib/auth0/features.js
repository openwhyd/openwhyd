// @ts-check

/**
 * @param {typeof process.env} env
 * @returns {import('../my-http-wrapper/http/AuthFeatures').AuthFeatures}
 */
exports.makeAuthFeatures = (env) => {
  const { Auth0Wrapper } = require('.');

  const auth0 = new Auth0Wrapper(env); // throws if required env vars are missing

  return {
    /**
     * Attach /login, /logout, and /signup routes to Express.js application server.
     * @param {import('express').Express} app
     * @param {string} urlPrefix
     */
    injectExpressRoutes(app, urlPrefix) {
      // attach /login, /logout, and /callback routes to the baseURL
      app.use(auth0.makeExpressAuthMiddleware(urlPrefix));

      // redirects to Auth0's sign up dialog
      app.get(
        '/signup',
        auth0.makeSignupRoute({
          returnTo: '/register', // so we can create the user in our database too
        }),
      );
    },

    sendPasswordChangeRequest(email) {
      return auth0.sendPasswordChangeRequest(email).catch((err) => {
        console.trace('failed to pass new user password to Auth0:', err);
      });
    },
  };
};
