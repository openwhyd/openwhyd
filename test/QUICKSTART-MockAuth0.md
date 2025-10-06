# Quick Start: Testing with Mock Auth0

This guide shows how to write tests that use the Mock Auth0 server instead of connecting to a real Auth0 instance.

## Why Use Mock Auth0?

✅ **No external dependencies** - Tests run without internet access  
✅ **Fast** - No network latency  
✅ **Free** - No Auth0 subscription needed  
✅ **Deterministic** - Full control over test data  
✅ **Isolated** - Each test suite can have its own users  

## Example Test

Here's a complete example of a test using Mock Auth0:

```javascript
const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
const { ADMIN_USER } = require('../fixtures.js');

describe('my feature with auth0', function() {
  let openwhyd;

  before(async function() {
    // Start Openwhyd with mock Auth0
    openwhyd = new OpenwhydTestEnv({
      startWithEnv: process.env.START_WITH_ENV_FILE,
      withMockAuth0: true, // 👈 Enable mock Auth0
    });
    await openwhyd.setup();
    
    // Add test users
    const mockAuth0 = openwhyd.getMockAuth0();
    mockAuth0.addUser({
      id: ADMIN_USER.id,
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      username: ADMIN_USER.username,
    });
  });

  after(async function() {
    await openwhyd.release();
  });

  beforeEach(async function() {
    await openwhyd.reset();
  });

  it('should authenticate with mock Auth0', async function() {
    const mockAuth0 = openwhyd.getMockAuth0();
    
    // Generate a token for the user
    const token = await mockAuth0.buildToken(ADMIN_USER.id);
    
    // Use the token in API requests
    // (Full session management support coming soon)
    assert(token);
  });
});
```

## Running the Tests

```bash
# Start MongoDB
docker compose up --detach mongo

# Run your tests
START_WITH_ENV_FILE='./env-vars-testing.conf' \
  npx mocha test/api/my-test.js --timeout 20000
```

## Current Capabilities

The mock Auth0 server currently supports:

✅ OIDC Discovery endpoint  
✅ JWKS (public keys) endpoint  
✅ JWT token generation with custom claims  
✅ Multiple test users  
✅ Environment variable configuration  

## Limitations & Future Work

⚠️ **Session management**: Currently, you need to manually handle session cookies. A helper for session injection is planned.

⚠️ **OAuth2 flow**: The full authorization code flow is not yet fully integrated with Openwhyd tests. For now, you can generate tokens directly.

⚠️ **Management API**: User management operations (create, update, delete) are not yet mocked.

## See Also

- [Detailed Documentation](./README-MockAuth0.md)
- [MockAuth0Server Unit Tests](./MockAuth0Server.test.js)
- [Integration Test Example](./api/auth0.api.tests.js)

## Next Steps

After running the tests successfully, consider:

1. Converting more legacy auth tests to use Mock Auth0
2. Adding session injection helpers for easier authenticated API testing
3. Testing the full OAuth2 authorization flow
4. Mocking the Auth0 Management API for user CRUD operations
