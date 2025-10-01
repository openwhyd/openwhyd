// @ts-check

/**
 * Simple test to verify MockAuth0Server works correctly.
 * Run with: npx mocha test/MockAuth0Server.test.js
 */

const assert = require('assert');
const { MockAuth0Server } = require('./MockAuth0Server.js');

describe('MockAuth0Server', function () {
  let mockAuth0;

  before(async function () {
    this.timeout(5000);
    mockAuth0 = new MockAuth0Server();
    await mockAuth0.start(18081); // Use a different port to avoid conflicts
  });

  after(async function () {
    await mockAuth0.stop();
  });

  it('should start and provide an issuer URL', function () {
    assert.equal(mockAuth0.getIssuerUrl(), 'http://localhost:18081');
  });

  it('should provide Auth0 environment variables', function () {
    const env = mockAuth0.getEnvVars();
    assert.equal(env.AUTH0_ISSUER_BASE_URL, 'http://localhost:18081');
    assert.equal(env.AUTH0_CLIENT_ID, 'mock-client-id');
    assert(env.AUTH0_SECRET);
  });

  it('should add a user and build a token for them', async function () {
    mockAuth0.addUser({
      id: 'testuser123',
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
    });

    const token = await mockAuth0.buildToken('testuser123');
    assert(token);
    assert(typeof token === 'string');

    // Decode the token to verify claims (simple base64 decode)
    const parts = token.split('.');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );

    assert.equal(payload.sub, 'auth0|testuser123');
    assert.equal(payload.email, 'test@example.com');
    assert.equal(payload.name, 'Test User');
  });

  it('should throw an error when building token for non-existent user', async function () {
    try {
      await mockAuth0.buildToken('nonexistent');
      assert.fail('Expected error to be thrown');
    } catch (err) {
      assert(err.message.includes('not found'));
    }
  });
});
