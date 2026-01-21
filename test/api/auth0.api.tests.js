// @ts-check

/**
 * Integration test to verify that Openwhyd can work with Mock Auth0 server.
 * This demonstrates that automated tests can run without connecting to real Auth0.
 * 
 * Run with: START_WITH_ENV_FILE='./env-vars-testing.conf' npx mocha test/api/auth0.api.tests.js --timeout 20000
 */

const assert = require('assert');
const request = require('request');
const { promisify } = require('util');
const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
const { ADMIN_USER } = require('../fixtures.js');

describe('auth0 api integration', function () {
  this.timeout(20000);
  
  let openwhyd;

  before(async function () {
    // Start Openwhyd with mock Auth0 enabled
    openwhyd = new OpenwhydTestEnv({
      startWithEnv: process.env.START_WITH_ENV_FILE,
      withMockAuth0: true, // This enables the mock Auth0 server
    });
    await openwhyd.setup();
    
    // Add test users to the mock Auth0 server
    const mockAuth0 = openwhyd.getMockAuth0();
    mockAuth0.addUser({
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      username: ADMIN_USER.username || 'admin',
    });
  });

  after(async function () {
    await openwhyd.release();
  });

  beforeEach(async function () {
    await openwhyd.reset();
  });

  describe('Mock Auth0 Server', () => {
    it('should be running and accessible', async () => {
      const mockAuth0 = openwhyd.getMockAuth0();
      const response = await promisify(request.get)({
        url: `${mockAuth0.getIssuerUrl()}/.well-known/openid-configuration`,
        json: true,
      });
      
      assert.equal(response.statusCode, 200);
      assert(response.body.issuer);
      assert(response.body.jwks_uri);
      assert(response.body.authorization_endpoint);
      assert(response.body.token_endpoint);
    });

    it('should provide JWKS endpoint', async () => {
      const mockAuth0 = openwhyd.getMockAuth0();
      const response = await promisify(request.get)({
        url: `${mockAuth0.getIssuerUrl()}/jwks`,
        json: true,
      });
      
      assert.equal(response.statusCode, 200);
      assert(Array.isArray(response.body.keys));
      assert(response.body.keys.length > 0);
    });

    it('should generate valid JWT tokens for test users', async () => {
      const mockAuth0 = openwhyd.getMockAuth0();
      const token = await mockAuth0.buildToken(ADMIN_USER.id);
      assert(token);
      assert(typeof token === 'string');
      
      // Decode the token to verify claims
      const parts = token.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      );
      
      assert.equal(payload.sub, `auth0|${ADMIN_USER.id}`);
      assert.equal(payload.email, ADMIN_USER.email);
      assert.equal(payload.name, ADMIN_USER.name);
      assert.equal(payload.iss, `${mockAuth0.getIssuerUrl()}/`);
    });
  });

  describe('Environment Configuration', () => {
    it('should have Auth0 environment variables configured', () => {
      const mockAuth0 = openwhyd.getMockAuth0();
      const env = mockAuth0.getEnvVars();
      assert.equal(env.AUTH0_ISSUER_BASE_URL, mockAuth0.getIssuerUrl());
      assert(env.AUTH0_CLIENT_ID);
      assert(env.AUTH0_CLIENT_SECRET);
      assert(env.AUTH0_SECRET);
    });

    it('should have configured Openwhyd to use mock Auth0', () => {
      const env = openwhyd.getEnv();
      const mockAuth0 = openwhyd.getMockAuth0();
      assert.equal(env.AUTH0_ISSUER_BASE_URL, mockAuth0.getIssuerUrl());
    });
  });

  // Note: To fully test Auth0 integration with Openwhyd, we would need to:
  // 1. Simulate the OAuth2 flow or directly inject session cookies
  // 2. Test that authenticated requests work
  // 
  // This is left for future implementation. The current test demonstrates
  // that the mock Auth0 server is functional and can be integrated.
});
