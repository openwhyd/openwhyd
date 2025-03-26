// @ts-check

// $ npx mocha test/functional/postTrack-api.tests.js

const express = require('express');
const request = require('supertest');
const { injectOpenwhydAPIV2 } = require('../../app/api-v2/OpenwhydApiV2.js');
const assert = require('assert');

describe('postTrack API', () => {
  it('should return a 401 with a JSON error message when trying to post a track without token', async () => {
    const app = express();
    injectOpenwhydAPIV2(
      app,
      {
        issuerBaseURL:
          process.env.AUTH0_ISSUER_BASE_URL ?? 'https://dummy.eu.auth0.com', // identifier of the Auth0 account
        urlPrefix: `http://localhost`, // identifier of Openwhyd API v2, as set on Auth0
      },
      {
        postTrack: () => Promise.resolve({ url: 'dummy' }),
      },
    );

    const response = await request(app)
      .post('/api/v2/postTrack')
      .set('Accept', 'application/json')
      .send({})
      .expect('Content-Type', /json/)
      .expect(401); // thrown by checkAuthOrThrow()

    assert.equal(response.body.error, 'Unauthorized'); // thrown by checkAuthOrThrow()
  });
});
