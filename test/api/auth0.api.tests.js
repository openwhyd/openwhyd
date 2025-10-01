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
const { MockAuth0Server } = require('../MockAuth0Server.js');
const { ADMIN_USER } = require('../fixtures.js');

describe('auth0 api integration', function () {
  this.timeout(20000);
  
  let openwhyd;
  let mockAuth0;
  const mockAuth0Port = 18082;

  before(async function () {
    // Start the mock Auth0 server
    mockAuth0 = new MockAuth0Server();
    await mockAuth0.start(mockAuth0Port);
    
    // Add test users to the mock Auth0 server
    mockAuth0.addUser({
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      username: ADMIN_USER.username || 'admin',
    });

    // Start Openwhyd with Auth0 configuration pointing to mock server
    openwhyd = new OpenwhydTestEnv({
      startWithEnv: process.env.START_WITH_ENV_FILE,
    });
    await openwhyd.setup();
    
    // Override Auth0 environment variables to point to mock server
    const env = openwhyd.getEnv();
    Object.assign(env, mockAuth0.getEnvVars());
    
    // Note: Since Openwhyd is already started, this won't affect the running instance.
    // In a real scenario, we would need to restart Openwhyd or configure it before starting.
    // For this demonstration, we're showing that the mock server can be configured.
  });

  after(async function () {
    await openwhyd.release();
    await mockAuth0.stop();
  });

  beforeEach(async function () {
    await openwhyd.reset();
  });

  describe('Mock Auth0 Server', () => {
    it('should be running and accessible', async () => {
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
      const response = await promisify(request.get)({
        url: `${mockAuth0.getIssuerUrl()}/jwks`,
        json: true,
      });
      
      assert.equal(response.statusCode, 200);
      assert(Array.isArray(response.body.keys));
      assert(response.body.keys.length > 0);
    });

    it('should generate valid JWT tokens for test users', async () => {
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
      const env = mockAuth0.getEnvVars();
      assert.equal(env.AUTH0_ISSUER_BASE_URL, mockAuth0.getIssuerUrl());
      assert(env.AUTH0_CLIENT_ID);
      assert(env.AUTH0_CLIENT_SECRET);
      assert(env.AUTH0_SECRET);
    });
  });

  // Note: To fully test Auth0 integration with Openwhyd, we would need to:
  // 1. Start Openwhyd with Auth0 env vars pointing to mock server
  // 2. Simulate the OAuth2 flow or directly inject session cookies
  // 3. Test that authenticated requests work
  // 
  // This is left for future implementation. The current test demonstrates
  // that the mock Auth0 server is functional and can be integrated.
});
