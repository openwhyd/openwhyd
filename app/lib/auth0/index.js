// @ts-check

// This file provides wrappers for authentication provider "Auth0".

const DATABASE_CONNECTION_NAME = 'Username-Password-Authentication';

const findMissingEnvVars = (env) => {
  const missing = [];
  if (!env.AUTH0_SECRET) missing.push('AUTH0_SECRET');
  if (!env.AUTH0_CLIENT_ID) missing.push('AUTH0_CLIENT_ID');
  if (!env.AUTH0_CLIENT_SECRET) missing.push('AUTH0_CLIENT_SECRET');
  if (!env.AUTH0_ISSUER_BASE_URL) missing.push('AUTH0_ISSUER_BASE_URL');
  return missing;
};

/**@param {Record<string, any>} user */
exports.getUserIdFromOidcUser = (user) => user?.sub?.replace('auth0|', '');

const makeAuth0UserId = (userId) => `auth0|${userId}`;

/**
 * @param {import('express').Request} request
 * @returns {string | null} ID of the user who is logged in, or null.
 */
exports.getAuthenticatedUserId = (request) => {
  return request.oidc?.isAuthenticated()
    ? exports.getUserIdFromOidcUser(request.oidc.user)
    : null;
};

/** @typedef {{ sub: string, name: string, email: string, picture: string }} OidcUser */

/**
 * @param {import('express').Request} request
 * @returns {OidcUser | null} User who is logged in, or null.
 */
exports.getAuthenticatedUser = (request) => {
  if (!request.oidc?.isAuthenticated()) return null;
  const { sub, name, email, picture } = /** @type {OidcUser} */ (
    request.oidc.user
  );
  if (typeof sub !== 'string') throw new Error('invalid sub');
  if (typeof name !== 'string') throw new Error('invalid name');
  if (typeof email !== 'string') throw new Error('invalid email');
  if (typeof picture !== 'string') throw new Error('invalid picture');
  return { sub, name, email, picture };
};

/**
 * @param {OidcUser} oidcUser
 * @returns {import('../my-http-wrapper/http/AuthFeatures').OpenwhydUser}
 */
exports.mapToOpenwhydUser = (oidcUser) => {
  // note: for some reason, the username provided during signup is not included in oidcUser
  return {
    id: exports.getUserIdFromOidcUser(oidcUser),
    name: oidcUser.name.split('@')[0], // while we tested signups, name===email. => extract the user name from email address
    email: oidcUser.email,
    img: oidcUser.picture,
    // handle: oidcUser.username, // TODO: check that it complies with our rules, first
  };
};

exports.Auth0Wrapper = class Auth0Wrapper {
  constructor(env) {
    const missing = findMissingEnvVars(env);
    if (missing.length > 0) {
      throw new Error(`missing env vars: ${missing.join(', ')}`);
    }
    this.env = env;
  }

  /** @returns Express.js middleware with /login, /logout, and /callback routes. */
  makeExpressAuthMiddleware(urlPrefix) {
    const openId = require('express-openid-connect');
    return openId.auth({
      authRequired: false,
      auth0Logout: true,
      baseURL: urlPrefix,
      secret: this.env.AUTH0_SECRET,
      clientID: this.env.AUTH0_CLIENT_ID,
      issuerBaseURL: this.env.AUTH0_ISSUER_BASE_URL,
      // cf https://auth0.github.io/express-openid-connect/interfaces/ConfigParams.html#getLoginState
      getLoginState() {
        return {
          returnTo: '/register',
        };
      },
      session: {
        cookie: {
          domain: new URL(urlPrefix).hostname,
        },
      },
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

  /**
   * Instanciate a client to send requests to Auth0 Management API.
   * @private
   * @param {object} param
   * @param {'update:users' | 'create:user_tickets' | 'delete:users'} param.scope
   * @returns {ManagementClient}
   */
  getManagementClient() {
    const { ManagementClient } = require('auth0');
    return new ManagementClient({
      domain: this.env.AUTH0_ISSUER_BASE_URL.split('//').pop(),
      clientId: this.env.AUTH0_CLIENT_ID,
      clientSecret: this.env.AUTH0_CLIENT_SECRET,
    });
  }

  /**
   * Instanciate a client to send requests to Auth0 Authentication API.
   * @private
   * @returns {AuthenticationClient}
   */
  getAuthenticationClient() {
    const { AuthenticationClient } = require('auth0');
    return new AuthenticationClient({
      domain: this.env.AUTH0_ISSUER_BASE_URL.split('//').pop(),
      clientId: this.env.AUTH0_CLIENT_ID,
    });
  }

  /**
   * Ask Auth0 to update a user's username/handle, name or email.
   * Prerequisites:
   * - Machine-to-machine API must be enabled for this app; (cf https://manage.auth0.com/dashboard/eu/dev-vh1nl8wh3gmzgnhp/apis/63d3adf22b7622d7aaa45805/authorized-clients)
   * - "update:users" permission must be granted on that API client.
   * @param {string} userId
   * @param {{username: string} | {name: string} | {email: string}} patch
   * @returns Promise<void>
   */
  async patchUser(userId, patch) {
    console.debug(
      `[auth0] patching ${Object.keys(patch).join(', ')} on user ${userId}`,
    );
    return await this.getManagementClient().users.update(
      { id: makeAuth0UserId(userId) },
      { connection: DATABASE_CONNECTION_NAME, ...patch }, // connection is needed when updating email address, cf https://auth0.com/docs/api/management/v2/users/patch-users-by-id
    );
  }

  /**
   * Ask Auth0 to send a password change request by email.
   * Prerequisites:
   * - Machine-to-machine API must be enabled for this app; (cf https://manage.auth0.com/dashboard/eu/dev-vh1nl8wh3gmzgnhp/apis/63d3adf22b7622d7aaa45805/authorized-clients)
   * - "create:user_tickets" permission must be granted on that API client.
   * @param {string} email
   * @returns Promise<void>
   */
  async sendPasswordChangeRequest(email) {
    console.debug(
      `[auth0] requesting password change for user ${email.split('@')[0]}@...`,
    );
    return await this.getAuthenticationClient().database.changePassword({
      connection: DATABASE_CONNECTION_NAME,
      email,
    });
  }

  /**
   * Ask Auth0 to delete a user.
   * Prerequisites:
   * - Machine-to-machine API must be enabled for this app; (cf https://manage.auth0.com/dashboard/eu/dev-vh1nl8wh3gmzgnhp/apis/63d3adf22b7622d7aaa45805/authorized-clients)
   * - "delete:users" permission must be granted on that API client.
   * @param {string} userId
   * @returns Promise<void>
   */
  async deleteUser(userId) {
    console.debug(`[auth0] deleting user ${userId}...`);
    return await this.getManagementClient().users.delete({
      id: makeAuth0UserId(userId),
    });
  }
};
