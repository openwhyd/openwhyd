// @ts-check

/**
 * @param {typeof process.env} env
 * @returns {import('../my-http-wrapper/http/AuthFeatures').AuthFeatures}
 */
exports.makeAuthFeatures = (env) => {
  const {
    Auth0Wrapper,
    getAuthenticatedUser,
    mapToOpenwhydUser,
  } = require('.');

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

    getAuthenticatedUser(request) {
      const oidcUser = getAuthenticatedUser(request);
      return oidcUser ? mapToOpenwhydUser(oidcUser) : null;
    },

    async sendPasswordChangeRequest(email) {
      await auth0.sendPasswordChangeRequest(email);
    },

    async setUserHandle(userId, username) {
      await auth0
        .patchUser(userId, { username })
        .catch((err) =>
          console.trace('failed to send username change to Auth0:', err),
        );
    },

    async setUserEmail(userId, email) {
      await auth0.patchUser(userId, { email }).catch((err) => {
        if (
          !err.message.endsWith(
            'User with old email does not exist in Auth0 database',
          )
        ) {
          // this happens when the email address has already been updated <= workaround to cover a bug in our settings page
          console.trace('failed to pass new user email to Auth0:', err);
        }
      });
    },

    /**
     * @param {string} userId
     * @param {string} name
     * @throws {ManagementApiError} e.g. if name is too short
     */
    async setUserProfileName(userId, name) {
      await auth0.patchUser(userId, { name });
    },

    async deleteUser(userId) {
      await auth0
        .deleteUser(userId)
        .catch((err) =>
          console.trace('failed to delete user from Auth0:', err),
        );
    },
  };
};
