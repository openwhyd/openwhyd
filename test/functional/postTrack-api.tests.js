// @ts-check

// $ npx mocha test/functional/postTrack-api.tests.js

const express = require('express');
const request = require('supertest');
const {
  injectOpenwhydAPIV2,
} = require('../../app/lib/my-http-wrapper/http/OpenwhydApiV2.js');
const assert = require('assert');

describe('postTrack API', () => {
  it('should respond with a 401 status code when trying to post a track without token', async () => {
    const app = express();
    injectOpenwhydAPIV2(app, {
      issuerBaseURL:
        process.env.AUTH0_ISSUER_BASE_URL ?? 'https://dummy.eu.auth0.com', // identifier of the Auth0 account
      urlPrefix: `http://localhost`, // identifier of Openwhyd API v2, as set on Auth0
    });

    await request(app)
      .post('/api/v2/postTrack')
      .send({}) // no token
      .expect(401);
  });

  it('should respond with an error message when trying to post a track without token', async () => {
    const app = express();
    injectOpenwhydAPIV2(app, {
      issuerBaseURL:
        process.env.AUTH0_ISSUER_BASE_URL ?? 'https://dummy.eu.auth0.com', // identifier of the Auth0 account
      urlPrefix: `http://localhost`, // identifier of Openwhyd API v2, as set on Auth0
    });

    await request(app)
      .post('/api/v2/postTrack')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({}) // no token
      .then((response) => {
        assert.equal(response.body.error, 'Unauthorized'); // thrown by checkAuthOrThrow()
      });
  });
});
