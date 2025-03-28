// @ts-check

const assert = require('assert');
const { Ajv } = require('ajv');
const { auth } = require('express-oauth2-jwt-bearer'); // to check Authorization Bearer tokens
// const { rateLimit } = require('express-rate-limit');

const { getUserIdFromOidcUser } = require('../lib/auth0/index.js');
const {
  userCollection,
} = require('../infrastructure/mongodb/UserCollection.js');
const { ErrorWithStatusCode } = require('../lib/ErrorWithStatusCode.js');

/** @type {import('ajv').JSONSchemaType<import('../domain/api/Features.js').PostTrackRequest>} */
// @ts-ignore type checking for JSONSchemaType can only work if strictNullChecks is enabled
const schema = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    title: { type: 'string' },
    thumbnail: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
  },
  required: ['url', 'title'],
  additionalProperties: false,
};

/**
 * Parse track data from request's payload/body.
 * @param {import('express').Request['body']} requestBody
 */
function validatePostTrackRequest(requestBody) {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const postTrackRequest = validate(requestBody);
  assert.ok(
    postTrackRequest,
    `Invalid postTrack request: ${ajv.errorsText(validate.errors)}`,
  );
  // The type assertion below can be removed after enabling strictNullChecks and removing the ts-ignore above
  return /** @type {import('../domain/api/Features.js').PostTrackRequest} */ (
    requestBody
  );
}

exports.validatePostTrackRequest = validatePostTrackRequest;

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
   * Read the JWT Access Token from the Authorization header and return the corresponding user, if valid.
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @throws {ErrorWithStatusCode} if token is invalid
   */
  async function getUserFromAuthorizationHeader(request, response) {
    // Call the auth middleware programmatically to check the access token, and intercept errors
    // (e.g. InvalidTokenError), so they can be handled by caller, instead of by Express.
    await new Promise((resolve, reject) =>
      useAuth(request, response, (err) =>
        err ? reject(new ErrorWithStatusCode(401, err.message)) : resolve,
      ),
    );
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

  // TODO: re-enable rate limiting, after finding out why some requests don't respond
  // const rateLimiter = rateLimit({
  //   windowMs: 1000, // 1 second
  //   limit: 1, // Limit each IP to 1 request per `window`
  //   message: { error: 'Too many requests, please try again later' },
  //   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  //   legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  //   // store: ... , // by default, the memory store is used
  // });

  app.post(
    '/api/v2/postTrack',
    /*rateLimiter,*/ async (request, response) => {
      try {
        console.log(`/api/v2/postTrack`);
        const user = await getUserFromAuthorizationHeader(request, response); // may throws a 401 error

        const postTrackRequest = validatePostTrackRequest(request.body);
        console.log(`/api/v2/postTrack req:`, JSON.stringify(postTrackRequest));

        const { url } = await features.postTrack(user, postTrackRequest);
        response.status(200).json({ url });
      } catch (err) {
        console.warn(`/api/v2/postTrack err:`, err);
        response
          .status(err instanceof ErrorWithStatusCode ? err.statusCode : 400)
          .json({ error: err.message });
      }
    },
  );
};
