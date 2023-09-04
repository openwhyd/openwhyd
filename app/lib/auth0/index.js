// @ts-check

const findMissingEnvVars = (env) => {
  const missing = [];
  if (!env.AUTH0_SECRET) missing.push('AUTH0_SECRET');
  if (!env.AUTH0_CLIENT_ID) missing.push('AUTH0_CLIENT_ID');
  if (!env.AUTH0_CLIENT_SECRET) missing.push('AUTH0_CLIENT_SECRET');
  if (!env.AUTH0_ISSUER_BASE_URL) missing.push('AUTH0_ISSUER_BASE_URL');
  return missing;
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
      secret: this.env.AUTH0_SECRET,
      baseURL: urlPrefix,
      clientID: this.env.AUTH0_CLIENT_ID,
      issuerBaseURL: this.env.AUTH0_ISSUER_BASE_URL,
      // cf https://auth0.github.io/express-openid-connect/interfaces/ConfigParams.html#afterCallback
      // afterCallback: async (req, res, session, decodedState) => {
      //   const userProfile = await request(
      //     `${AUTH0_ISSUER_BASE_URL}/userinfo`,
      //   );
      //   console.warn('afterCallback', {
      //     session,
      //     decodedState,
      //     userProfile,
      //   });
      //   return { ...session, userProfile }; // access using req.appSession.userProfile
      // },
    });
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
