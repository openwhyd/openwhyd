// @ts-check

const assert = require('assert');
const { auth } = require('express-oauth2-jwt-bearer'); // to check Authorization Bearer tokens
const { getUserIdFromOidcUser } = require('../../auth0/index.js');
const config = require('../../../models/config.js');
const postModel = require('../../../models/post.js');
const {
  userCollection,
} = require('../../../infrastructure/mongodb/UserCollection');

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
  /** @type {import('../../../domain/api/Features').PostTrackRequest} */
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
 * @param {import('../../../domain/user/types.ts').User} user
 * @param {import('../../../domain/api/Features.ts').PostTrackRequest} postTrackRequest
 */
async function postTrack(user, postTrackRequest) {
  // extract the youtube video id from the URL
  const eId = config.translateUrlToEid(postTrackRequest.url);
  if (!eId || !eId.startsWith('/yt/'))
    throw new Error(`unsupported url: ${postTrackRequest.url}`);
  console.log(`/api/v2/postTrack, embed id: ${eId}`);

  // create document to be stored in DB
  const postDocument = {
    uId: user.id,
    uNm: user.name,
    eId,
    name: postTrackRequest.title,
    img: postTrackRequest.thumbnail,
    text: postTrackRequest.description,
  };
  console.log(`/api/v2/postTrack doc:`, JSON.stringify(postDocument));

  // store the post in DB + search index
  const posted = await new Promise((resolve, reject) =>
    postModel.savePost(postDocument, (res) =>
      res
        ? resolve(res)
        : reject(new Error('failed to post the track in database')),
    ),
  );
  return { url: `${process.env.WHYD_URL_PREFIX}/c/${posted._id}` };
}

/**
 * @param {import('express').Express} app with json body parser
 * @param {{ issuerBaseURL: string, urlPrefix: string }} authParams
 */
exports.injectOpenwhydAPIV2 = (app, authParams) => {
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

  app.post('/api/v2/postTrack', async (request, response) => {
    try {
      await checkAuthOrThrow(request); // populates request.auth, or throws a 401 error
      const user = await getUserFromAuthorizationHeader(request);

      const postTrackRequest = validatePostTrackRequest(request.body);
      console.log(`/api/v2/postTrack req:`, JSON.stringify(postTrackRequest));

      const { url } = await postTrack(user, postTrackRequest);
      response.status(200).json({ url });
    } catch (err) {
      response
        .status(err instanceof ErrorWithStatusCode ? err.statusCode : 400)
        .json({ error: err.message });
    }
  });
};
