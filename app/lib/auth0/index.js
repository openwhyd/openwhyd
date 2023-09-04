// @ts-check

// This file provides wrappers for authentication provider "Auth0".

const findMissingEnvVars = (env) => {
  const missing = [];
  if (!env.AUTH0_SECRET) missing.push('AUTH0_SECRET');
  if (!env.AUTH0_CLIENT_ID) missing.push('AUTH0_CLIENT_ID');
  if (!env.AUTH0_CLIENT_SECRET) missing.push('AUTH0_CLIENT_SECRET');
  if (!env.AUTH0_ISSUER_BASE_URL) missing.push('AUTH0_ISSUER_BASE_URL');
  return missing;
};

const getUserIdFromOidcUser = (user) => user?.sub.replace('auth0|', '');

/**
 * @param {import('express').Request} request
 * @returns {string | null} ID of the user who is logged in, or null.
 */
exports.getAuthenticatedUserId = (request) => {
  return request.oidc?.isAuthenticated()
    ? getUserIdFromOidcUser(request.oidc.user)
    : null;
};

/**
 * @param {import('express').Request} request
 * @returns {unknown | null} User who is logged in, or null.
 */
exports.getAuthenticatedUser = (request) => {
  return request.oidc?.isAuthenticated() ? request.oidc.user : null;
};

exports.Auth0Wrapper = class Auth0Wrapper {
  constructor(env) {
    const missing = findMissingEnvVars(env);
    if (missing.length > 0) {
      throw new Error(`missing env vars: ${missing.join(', ')}`);
    }
    this.env = env;
  }

  /** @returns Express.js middle with /login, /logout, and /callback routes. */
  makeExpressAuthMiddleware(urlPrefix) {
    const openId = require('express-openid-connect');
    return openId.auth({
      authRequired: false,
      auth0Logout: true,
      baseURL: urlPrefix,
      secret: this.env.AUTH0_SECRET,
      clientID: this.env.AUTH0_CLIENT_ID,
      issuerBaseURL: this.env.AUTH0_ISSUER_BASE_URL,
      // cf https://auth0.github.io/express-openid-connect/interfaces/ConfigParams.html#afterCallback
      // afterCallback: async (req, res, session, decodedState) => {
      //   const userProfile = await request(`${AUTH0_ISSUER_BASE_URL}/userinfo`);
      //   return { ...session, userProfile }; // access using req.appSession.userProfile
      // },
    });
  }

  /** @returns Express.js route handler that redirects to Auth0's sign up dialog. */
  makeSignupRoute({ returnTo }) {
    return (req, res) => {
      res.oidc.login({
        authorizationParams: { screen_hint: 'signup' },
        returnTo,
      });
    };
  }
};

exports.updateUserName = async (userId, name) => {
  // Prerequisite: this API call requires
  // - that Machine-to-machine API is enabled for this app
  // - and that "update:users" permission is granted.
  // See https://manage.auth0.com/dashboard/eu/dev-vh1nl8wh3gmzgnhp/apis/63d3adf22b7622d7aaa45805/authorized-clients
  const { ManagementClient } = require('auth0');
  return await new ManagementClient({
    domain: process.env.AUTH0_ISSUER_BASE_URL.split('//').pop(),
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: 'update:users',
  }).updateUser({ id: `auth0|${userId}` }, { name });
};

// example of route that gets user profile info from auth0
// app.get('/profile', openId.requiresAuth(), (req, res) => {
//   const user = req.oidc.user; // e.g. {"nickname":"admin","name":"admin","picture":"https://s.gravatar.com/avatar/xxxxxx.png","updated_at":"2023-08-30T15:02:17.071Z","email":"test@openwhyd.org","sub":"auth0|000000000000000000000001","sid":"XXXXXX-XXXXXX-XXXXXX"}
//   res.send(JSON.stringify(user));
// });
