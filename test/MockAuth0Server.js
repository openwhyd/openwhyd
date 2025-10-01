// @ts-check

/**
 * MockAuth0Server - A wrapper around oauth2-mock-server to simulate Auth0 for testing.
 * This allows tests to run without connecting to a real Auth0 instance.
 */

const { OAuth2Server } = require('oauth2-mock-server');

class MockAuth0Server {
  constructor() {
    this.server = new OAuth2Server();
    this.port = null;
    this.hostname = 'localhost';
    // Store users for authentication
    this.users = new Map();
  }

  /**
   * Start the mock Auth0 server.
   * @param {number} port - Port to listen on
   * @returns {Promise<void>}
   */
  async start(port = 8081) {
    this.port = port;
    
    // Generate a new RSA key for signing tokens
    await this.server.issuer.keys.generate('RS256');
    
    // Start the server
    await this.server.start(this.port, this.hostname);
    
    console.log(`Mock Auth0 server started at ${this.getIssuerUrl()}`);
  }

  /**
   * Stop the mock Auth0 server.
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.server) {
      await this.server.stop();
      console.log('Mock Auth0 server stopped');
    }
  }

  /**
   * Get the issuer URL for the mock server.
   * @returns {string}
   */
  getIssuerUrl() {
    return `http://${this.hostname}:${this.port}`;
  }

  /**
   * Add a test user to the mock server.
   * @param {object} user
   * @param {string} user.id - User ID
   * @param {string} user.email - User email
   * @param {string} user.name - User name
   * @param {string} user.username - User username/handle
   * @param {string} [user.picture] - User picture URL
   */
  addUser(user) {
    const userId = `auth0|${user.id}`;
    this.users.set(userId, {
      sub: userId,
      email: user.email,
      name: user.name,
      username: user.username,
      picture: user.picture || `https://www.gravatar.com/avatar/${user.id}`,
    });
  }

  /**
   * Build a JWT token for a user.
   * @param {string} userId - User ID (without auth0| prefix)
   * @returns {Promise<string>} JWT token
   */
  async buildToken(userId) {
    const auth0UserId = `auth0|${userId}`;
    const user = this.users.get(auth0UserId);
    
    if (!user) {
      throw new Error(`User ${userId} not found in mock server`);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    
    // Import jose to sign our own token using the mock server's keys
    const jose = require('jose');
    const keys = await this.server.issuer.keys.toJSON(true); // true = include private keys
    const key = keys[0]; // Use the first key
    
    // Convert JWK to KeyLike
    const privateKey = await jose.importJWK(key);
    
    // Create token payload
    const payload = {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
      iss: this.getIssuerUrl() + '/',
      aud: 'mock-client-id',
      iat: timestamp,
      exp: timestamp + 3600, // 1 hour expiry
      nbf: timestamp,
    };
    
    // Sign the token
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: key.alg, kid: key.kid })
      .sign(privateKey);
    
    return token;
  }

  /**
   * Get environment variables to configure Openwhyd to use this mock server.
   * @returns {Record<string, string>}
   */
  getEnvVars() {
    return {
      AUTH0_ISSUER_BASE_URL: this.getIssuerUrl(),
      AUTH0_CLIENT_ID: 'mock-client-id',
      AUTH0_CLIENT_SECRET: 'mock-client-secret',
      AUTH0_SECRET: 'mock-auth0-secret-at-least-32-characters-long',
    };
  }

  /**
   * Configure the mock server to return a specific user for the next token request.
   * This is useful for simulating the OAuth2 flow in tests.
   * @param {string} userId - User ID (without auth0| prefix)
   */
  setupNextTokenForUser(userId) {
    const auth0UserId = `auth0|${userId}`;
    const user = this.users.get(auth0UserId);
    
    if (!user) {
      throw new Error(`User ${userId} not found in mock server`);
    }

    // Customize the next token to include user information
    this.server.service.once('beforeTokenSigning', (token) => {
      const timestamp = Math.floor(Date.now() / 1000);
      token.payload.sub = user.sub;
      token.payload.email = user.email;
      token.payload.name = user.name;
      token.payload.picture = user.picture;
      token.payload.iss = this.getIssuerUrl() + '/';
      token.payload.aud = 'mock-client-id';
      token.payload.iat = timestamp;
      token.payload.exp = timestamp + 3600;
    });

    // Also set up userinfo endpoint response
    this.server.service.once('beforeUserinfo', (userInfoResponse) => {
      userInfoResponse.body = {
        sub: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
        email_verified: true,
      };
    });
  }
}

module.exports = { MockAuth0Server };
