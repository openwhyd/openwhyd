# Testing with Mock Auth0

This document explains how Openwhyd's automated tests use a mock Auth0 implementation to avoid dependencies on external authentication services.

## Overview

Openwhyd supports Auth0 as an identity provider for authentication. However, automated tests need to run reliably without requiring:

- Real Auth0 credentials
- Network access to Auth0 servers
- Test user accounts on Auth0

To solve this, we created a mock Auth0 implementation that mimics Auth0's behavior using local session management.

## How It Works

### Configuration

The mock Auth0 is automatically enabled when the `AUTH0_ISSUER_BASE_URL` environment variable is set to `"mock"`:

```bash
# In env-vars-testing.conf
AUTH0_ISSUER_BASE_URL="mock"
AUTH0_CLIENT_ID="mock_client_id"
AUTH0_CLIENT_SECRET="mock_client_secret"
AUTH0_SECRET="mock_secret_for_testing_only_not_secure"
```

### Architecture

1. **Mock Auth0 Features** (`app/lib/auth0/mock.js`)

   - Provides a drop-in replacement for Auth0 authentication features
   - Implements the same interface as the real Auth0 integration
   - Uses local database for user authentication
   - Manages sessions using express-session middleware

2. **Feature Detection** (`app/lib/auth0/features.js`)

   - Automatically detects when to use mock Auth0
   - Falls back to mock when `AUTH0_ISSUER_BASE_URL="mock"` or credentials are missing
   - Returns compatible authentication features interface

3. **Session Integration**
   - Mock Auth0 works alongside express-session middleware
   - Supports both OIDC sessions (new) and legacy whydUid sessions
   - Maintains backward compatibility with `/register` endpoint

### Authentication Flow

#### Login Flow with Mock Auth0

```
1. Test calls /login?action=login&email=test@openwhyd.org&md5=<hash>
2. Mock Auth0 route handler:
   - Validates credentials against database
   - Creates OIDC session: req.session.oidcUser
   - Sets legacy session: req.session.whydUid
3. Returns redirect URL or JSON response
4. Subsequent requests are authenticated via session
```

#### Signup Flow

```
1. Test calls /register with user data
2. Register controller creates user in database
3. Register sets legacy session: req.session.whydUid
4. Mock OIDC middleware recognizes whydUid as authenticated
5. User is logged in and can access protected endpoints
```

### Compatibility Features

The mock Auth0 implementation includes several compatibility features:

1. **Legacy Session Support**

   - Recognizes both `req.session.oidcUser` (Auth0) and `req.session.whydUid` (legacy)
   - Allows newly registered users to be authenticated
   - Maintains compatibility with existing `/register` endpoint

2. **HTML vs JSON Responses**

   - Returns HTML redirects for non-AJAX requests (security tests)
   - Returns JSON for AJAX requests (API tests)
   - Validates redirect URLs using the same security checks as legacy auth

3. **Middleware Ordering**
   - Mock routes are injected AFTER express-session middleware
   - Ensures `req.session` is properly initialized
   - Maintains all session methods like `.touch()`, `.save()`, etc.

## Running Tests

### API Tests

```bash
# Run all API tests with mock Auth0 (default)
npm run test:api

# Run with coverage
npm run test:api:coverage
```

### Other Test Suites

The mock Auth0 is automatically used in all test environments where Auth0 credentials are not provided:

- Unit tests
- Integration tests
- Approval tests
- E2E tests (when configured)

## Switching Between Mock and Real Auth0

### For Tests (Mock Auth0)

```bash
# env-vars-testing.conf
AUTH0_ISSUER_BASE_URL="mock"
```

### For Development (Real Auth0)

```bash
# .env-local
AUTH0_ISSUER_BASE_URL="https://dev-xxxxx.eu.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
AUTH0_SECRET="your-secret-generated-by-openssl"
```

### For Production (Real Auth0)

Production always uses real Auth0 with proper credentials configured in environment variables.

## Benefits

1. **No External Dependencies**: Tests run without network access
2. **Fast Execution**: No API calls to Auth0 servers
3. **Deterministic**: Tests always behave the same way
4. **Easy Setup**: Works out of the box with default test configuration
5. **Security**: No real credentials needed in CI/CD
6. **Cost**: No Auth0 API usage costs for testing

## Migration Path

This mock Auth0 implementation enables a gradual migration from legacy authentication:

1. ✅ Tests work with mock Auth0 (current state)
2. 🔄 Production uses real Auth0 (current state)
3. 🔄 Legacy `/login` endpoint can be safely removed once all tests migrate
4. 🔜 CVEs in legacy auth dependencies can be resolved

## Troubleshooting

### Tests failing with "req.session.touch is not a function"

This means the session object was deleted or replaced. The mock Auth0 should never delete `req.session`. Check that no code is doing `delete req.session` or `req.session = {}`.

### Tests failing with "Please login first"

The mock OIDC middleware needs to recognize the session as authenticated. Check that:

- `req.session.oidcUser` is set (for login)
- OR `req.session.whydUid` is set (for legacy/register)

### Server crashes during signup tests

Check that the session middleware is attached BEFORE the Auth0 routes in `Application.js`.

## Related Documentation

- [Legacy Login Flow](./legacy-login-flow.md)
- [API Documentation](./API.md)
- [Contributing Guide](./CONTRIBUTING.md)
