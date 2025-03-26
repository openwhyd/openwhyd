// @ts-check

const assert = require('assert');
const { auth } = require('express-oauth2-jwt-bearer'); // to check Authorization Bearer tokens
const { rateLimit } = require('express-rate-limit');

const { getUserIdFromOidcUser } = require('../lib/auth0/index.js');
const {
  userCollection,
} = require('../infrastructure/mongodb/UserCollection.js');

/**
 * Custom error class to include status codes.
 */
class ErrorWithStatusCode extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** @param {import('express').Request} request */
async function getUserFromAuthorizationHeader(request) {
  // Successful requests will have the following properties added to them:
  // - auth.token: The raw JWT token.
  // - auth.header: The decoded JWT header.
  // - auth.payload: The decoded JWT payload.
  // cf https://github.com/auth0/node-oauth2-jwt-bearer/blob/main/packages/express-oauth2-jwt-bearer/src/index.ts#L73
  const userId = getUserIdFromOidcUser(request.auth?.payload ?? {});
  const user = userId ? await userCollection.getByUserId(userId) : null;
  if (!user) throw new ErrorWithStatusCode(401, 'unauthorized');
  return user;
}

/** @param {import('express').Request['body']} requestBody */
function validatePostTrackRequest(requestBody) {
  // parse track data from request's payload/body
  const { url, title, thumbnail, description } = requestBody ?? {};

  // crude validation of PostTrackRequest
  /** @type {import('../domain/api/Features.js').PostTrackRequest} */
  const postTrackRequest = { url, title, thumbnail, description };
  for (const [key, value] of Object.entries(postTrackRequest)) {
    assert.equal(
      typeof value,
      'string',
      `${key} must be a string, got: ${typeof value}`,
    );
    // TODO: use a schema to validate, e.g. https://gist.github.com/adrienjoly/412c283b72dd648b256ed590283caa0c
  }
  return postTrackRequest;
}

/**
 * @param {import('express').Express} app with json body parser
 * @param {{ issuerBaseURL: string, urlPrefix: string }} authParams
 * @param {{ postTrack: import('../domain/api/Features.js').PostTrack }} features
 */
exports.injectOpenwhydAPIV2 = (app, authParams, features) => {
  const useAuth = auth({
    issuerBaseURL: authParams.issuerBaseURL, // identifier of the Auth0 account
    audience: `${authParams.urlPrefix}/api/v2/`, // identifier of Openwhyd API v2, as set on Auth0
    tokenSigningAlg: 'RS256', // as provided by Auth0's quickstart, after creating the API
  });

  /**
   * Call the auth middleware programmatically to check the token, and intercept errors
   * (e.g. InvalidTokenError), so they can be handled by caller, instead of by Express.
   * In case of success, request.auth will be populated with the following props:
   * - request.auth.token: The raw JWT token
   * - request.auth.header: The decoded JWT header
   * - request.auth.payload: The decoded JWT payload
   * @param {import('express').Request} request
   * @throws {ErrorWithStatusCode} if token is invalid
   */
  const checkAuthOrThrow = async (request) =>
    await new Promise((resolve, reject) =>
      useAuth(request, null, (err) =>
        err ? reject(new ErrorWithStatusCode(401, err.message)) : resolve,
      ),
    );

  const rateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    limit: 1, // Limit each IP to 1 request per `window`
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // by default, the memory store is used
  });

  app.post('/api/v2/postTrack', rateLimiter, async (request, response) => {
    try {
      await checkAuthOrThrow(request); // populates request.auth, or throws a 401 error
      const user = await getUserFromAuthorizationHeader(request);

      const postTrackRequest = validatePostTrackRequest(request.body);
      console.log(`/api/v2/postTrack req:`, JSON.stringify(postTrackRequest));

      const { url } = await features.postTrack(user, postTrackRequest);
      response.status(200).json({ url });
    } catch (err) {
      response
        .status(err instanceof ErrorWithStatusCode ? err.statusCode : 400)
        .json({ error: err.message });
    }
  });
};
