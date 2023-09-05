// @ts-check

/** @returns {import('../my-http-wrapper/http/AuthFeatures').AuthFeatures} */
exports.makeAuthFeatures = () => {
  const { Auth0Wrapper } = require('.');

  return {
    /**
     * Attach /login, /logout, and /signup routes to Express.js application server.
     * @param {import('express').Express} app
     * @param {string} urlPrefix
     */
    injectExpressRoutes(app, urlPrefix) {
      const auth0 = new Auth0Wrapper(process.env); // throws if required env vars are missing

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
  };
};
