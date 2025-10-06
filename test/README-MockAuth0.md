# Mock Auth0 Server for Testing

This directory contains the `MockAuth0Server` class that provides a local OAuth2/OIDC server for testing, eliminating the need to connect to a real Auth0 instance during automated tests.

## Overview

The mock Auth0 server is built on top of [`oauth2-mock-server`](https://github.com/axa-group/oauth2-mock-server) and provides:

- OpenID Connect Discovery endpoint
- JWKS (JSON Web Key Set) endpoint  
- Token generation with custom user claims
- Session management compatible with `express-openid-connect`

## Usage

### Basic Setup

```javascript
const { MockAuth0Server } = require('./test/MockAuth0Server.js');

// Create and start the mock server
const mockAuth0 = new MockAuth0Server();
await mockAuth0.start(18082); // Port number

// Add test users
mockAuth0.addUser({
  id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
});

// Generate a JWT token for a user
const token = await mockAuth0.buildToken('user123');

// Get environment variables for Openwhyd
const envVars = mockAuth0.getEnvVars();
// {
//   AUTH0_ISSUER_BASE_URL: 'http://localhost:18082',
//   AUTH0_CLIENT_ID: 'mock-client-id',
//   AUTH0_CLIENT_SECRET: 'mock-client-secret',
//   AUTH0_SECRET: 'mock-auth0-secret-at-least-32-characters-long'
// }

// Stop the server when done
await mockAuth0.stop();
```

### Integration with OpenwhydTestEnv

The recommended way to use MockAuth0Server is through `OpenwhydTestEnv`:

```javascript
const { OpenwhydTestEnv } = require('./test/OpenwhydTestEnv.js');
const { ADMIN_USER } = require('./test/fixtures.js');

describe('my test suite', function() {
  let openwhyd;

  before(async function() {
    // Start Openwhyd with mock Auth0 enabled
    openwhyd = new OpenwhydTestEnv({
      startWithEnv: './env-vars-testing.conf',
      withMockAuth0: true, // Enable mock Auth0
    });
    await openwhyd.setup();
    
    // Add test users to mock Auth0
    const mockAuth0 = openwhyd.getMockAuth0();
    mockAuth0.addUser({
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      username: ADMIN_USER.username,
    });
  });

  after(async function() {
    await openwhyd.release(); // Stops both Openwhyd and mock Auth0
  });

  it('should work with mock Auth0', async function() {
    const mockAuth0 = openwhyd.getMockAuth0();
    const token = await mockAuth0.buildToken(ADMIN_USER.id);
    // Use token for authenticated API calls
  });
});
```

## Running Tests

To run the mock Auth0 integration tests:

```bash
# Ensure MongoDB is running
docker compose up --detach mongo

# Run the tests
START_WITH_ENV_FILE='./env-vars-testing.conf' npx mocha test/api/auth0.api.tests.js --timeout 20000
```

## API Reference

### MockAuth0Server

#### Constructor

```javascript
const mockAuth0 = new MockAuth0Server();
```

#### Methods

##### `start(port)`

Start the mock Auth0 server.

- **port**: Port number to listen on (default: 8081)
- **Returns**: Promise<void>

##### `stop()`

Stop the mock Auth0 server.

- **Returns**: Promise<void>

##### `getIssuerUrl()`

Get the issuer URL for the mock server.

- **Returns**: string (e.g., `'http://localhost:18082'`)

##### `addUser(user)`

Add a test user to the mock server.

- **user**: Object with properties:
  - `id`: User ID (without `auth0|` prefix)
  - `email`: User email
  - `name`: User name
  - `username`: User username/handle
  - `picture`: User picture URL (optional)

##### `buildToken(userId)`

Build a JWT token for a user.

- **userId**: User ID (without `auth0|` prefix)
- **Returns**: Promise<string> - JWT token

##### `getEnvVars()`

Get environment variables to configure Openwhyd to use this mock server.

- **Returns**: Object with Auth0 environment variables

##### `setupNextTokenForUser(userId)`

Configure the mock server to return a specific user for the next token request. Useful for simulating the OAuth2 flow.

- **userId**: User ID (without `auth0|` prefix)

## Supported Endpoints

The mock Auth0 server provides the following endpoints:

- `GET /.well-known/openid-configuration` - OpenID Provider Configuration
- `GET /jwks` - JSON Web Key Set
- `POST /token` - Token endpoint (OAuth2)
- `GET /authorize` - Authorization endpoint (OAuth2)
- `GET /userinfo` - User info endpoint (OpenID Connect)
- `POST /revoke` - Token revocation endpoint
- `GET /endsession` - End session endpoint
- `POST /introspect` - Token introspection endpoint

## Benefits

- **No external dependencies**: Tests can run without network access to Auth0
- **Fast**: No network latency or rate limiting
- **Deterministic**: Full control over responses and token claims
- **Isolated**: Each test can have its own users and tokens
- **Cost-free**: No Auth0 subscription required for testing

## Future Enhancements

Potential improvements for the mock Auth0 server:

1. **Session injection helper**: Directly create authenticated sessions without going through OAuth2 flow
2. **Management API mock**: Mock Auth0 Management API endpoints (user CRUD, etc.)
3. **Configurable token expiry**: Allow tests to set custom expiry times
4. **Error simulation**: Helper methods to simulate Auth0 errors (invalid tokens, expired tokens, etc.)
5. **Multi-tenant support**: Support multiple Auth0 tenants in the same mock server

## See Also

- [oauth2-mock-server documentation](https://github.com/axa-group/oauth2-mock-server)
- [express-openid-connect documentation](https://github.com/auth0/express-openid-connect)
- [Auth0 documentation](https://auth0.com/docs)
