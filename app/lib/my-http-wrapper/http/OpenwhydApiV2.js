// @ts-check

const { auth } = require('express-oauth2-jwt-bearer'); // to check Authorization Bearer tokens
const postModel = require('../../../models/post.js');
const config = require('../../../models/config.js');
const { getUserIdFromOidcUser } = require('../../auth0/index.js');
const {
  userCollection,
} = require('../../../infrastructure/mongodb/UserCollection');

exports.injectOpenwhydAPIV2 = (app) => {
  const useAuth = auth({
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL, // identifier of the Auth0 account
    audience: `${process.env.WHYD_URL_PREFIX}/api/v2/`, // identifier of Openwhyd API v2, as set on Auth0
    tokenSigningAlg: 'RS256', // as provided by Auth0's quickstart, after creating the API
  });
  // TODO: on API routes, report errors (e.g. InvalidTokenError) in JSON format: { error: string }

  app.post('/api/v2/postTrack', useAuth, async (request, response) => {
    console.log(`/api/v2/postTrack`);

    // Successful requests will have the following properties added to them:
    // - auth.token: The raw JWT token.
    // - auth.header: The decoded JWT header.
    // - auth.payload: The decoded JWT payload.
    // cf https://github.com/auth0/node-oauth2-jwt-bearer/blob/main/packages/express-oauth2-jwt-bearer/src/index.ts#L73
    const userId = getUserIdFromOidcUser(request.auth?.payload ?? {});
    console.log(`/api/v2/postTrack, user id: ${userId}`);

    const user = userId ? await userCollection.getByUserId(userId) : null;
    if (!user) {
      response.status(401).json({ error: 'unauthorized' });
      return;
    }

    // parse track data from request's payload/body
    const { url, title, thumbnail, description } = request.body ?? {};
    console.log(`/api/v2/postTrack, embed url: ${url}`);

    // crude validation of PostTrackRequest
    /** @type {import('../../../domain/api/Features').PostTrackRequest} */
    const postTrackRequest = { url, title, thumbnail, description };
    for (const [key, value] of Object.entries(postTrackRequest)) {
      if (typeof value !== 'string') {
        response
          .status(400)
          .json({ error: `${key} must be a string, got: ${typeof value}` });
        return;
      }
    }
    console.log(`/api/v2/postTrack req:`, JSON.stringify(postTrackRequest));

    // extract the youtube video id from the URL
    const eId = config.translateUrlToEid(url);
    if (!eId || !eId.startsWith('/yt/')) {
      response.status(400).json({ error: `unsupported url: ${url}` });
      return;
    }
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
    const posted = await new Promise((resolve) =>
      postModel.savePost(postDocument, resolve),
    );

    // respond to request, based on result
    response
      .status(posted ? 200 : 400)
      .json(
        posted
          ? { url: `${process.env.WHYD_URL_PREFIX}/c/${posted._id}` }
          : { error: 'failed to post the track in database' },
      );
  });
};
