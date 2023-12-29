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
      if (!oidcUser) {
        // @ts-ignore // introduced for legacy auth/session, still used for whydUid
        delete request.session;
      }
      return oidcUser ? mapToOpenwhydUser(oidcUser) : null;
    },

    sendPasswordChangeRequest(email) {
      return auth0.sendPasswordChangeRequest(email).catch((err) => {
        console.trace('failed to pass new user password to Auth0:', err);
      });
    },

    setUserHandle(userId, username) {
      return auth0
        .patchUser(userId, { username })
        .catch((err) =>
          console.trace('failed to send username change to Auth0:', err),
        );
    },

    setUserEmail(userId, email) {
      return auth0.patchUser(userId, { email }).catch((err) => {
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

    setUserProfileName(userId, name) {
      return auth0
        .patchUser(userId, { name })
        .catch((err) =>
          console.trace('failed to forward user rename to Auth0:', err),
        );
    },

    deleteUser(userId) {
      return auth0
        .deleteUser(userId)
        .catch((err) =>
          console.trace('failed to delete user from Auth0:', err),
        );
    },
  };
};
