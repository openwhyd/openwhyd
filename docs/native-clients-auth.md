# Authentication options for native / 3rd-party clients

On openwhyd.org, all authentication is delegated to Auth0. The legacy `POST /login?action=login` (email + MD5) only works on Openwhyd servers that run **without** the `AUTH0_*` env vars (see [legacy-login-flow.md](./legacy-login-flow.md)). It does not work for accounts hosted on Auth0.

## What already exists

- **Read-only access**: the [Data Export API](./API.md#openwhyd-data-export-api) needs no authentication.
- **Write access (partial)**: `POST /api/v2/postTrack` (see `app/api-v2/OpenwhydApiV2.js`) accepts an Auth0 JWT access token in the `Authorization: ****** header, with audience `${WHYD_URL_PREFIX}/api/v2/`. It is currently the only API v2 endpoint, and it is rate-limited to 1 request / 5 seconds / IP.

## Options for write access from a native app

### Option A — Dedicated Auth0 "Native" application + PKCE (recommended)

Auth0 supports the OAuth 2.0 Authorization Code Flow with PKCE for native apps, and the Openwhyd API v2 already validates Auth0 access tokens.

Steps for an Openwhyd admin (Auth0 dashboard):

1. _Applications > Create Application_, type **Native**. Name it after the 3rd-party app.
2. Set **Allowed Callback URLs** / **Allowed Logout URLs** to the app's custom scheme or app link, e.g. `com.example.app://openwhyd.eu.auth0.com/android/com.example.app/callback`.
3. Under _Credentials_, keep the _Token Endpoint Authentication Method_ at `None` (public client, no secret is shared).
4. Under _APIs_, make sure the Openwhyd API v2 (audience `https://openwhyd.org/api/v2/`) is authorized for this application. Define scopes there (e.g. `post:track`) if we want to restrict what the app can do.
5. Enable _Refresh Token Rotation_ and `offline_access`, so the app can keep users logged in.
6. Share with the developer: Auth0 domain, client ID, and API audience (no secret).

The app then runs the standard flow (e.g. with Auth0.Android / Auth0.swift / AppAuth): `GET /authorize?response_type=code&client_id=…&redirect_uri=…&audience=<API audience>&scope=openid profile offline_access&code_challenge=…&code_challenge_method=S256`, followed by `POST /oauth/token`. The access token is then sent to `/api/v2/*`.

Server-side work: add more `/api/v2/*` endpoints (e.g. delete track, list own tracks, edit profile), reusing `getUserFromAuthorizationHeader`; optionally check scopes with `requiredScopes` from `express-oauth2-jwt-bearer`.

Pros: standard, secure, revocable per app, no credential handling by the app. Cons: one admin action per 3rd-party app; scope of API v2 is currently small.

### Option B — Shared client ID (no per-app registration)

Publish a single public Native Auth0 application for all community clients (same steps as A, with several allowed callback URLs or a generic one). Pros: no per-developer admin work. Cons: tokens cannot be revoked or rate-limited per app; all callback URLs are shared.

### Option C — Personal API tokens generated from the Openwhyd settings page

Users generate a long-lived token in their Openwhyd profile; the app sends it as `Authorization: Bearer`. Pros: simplest for users and developers, no Auth0 config. Cons: requires new server code (token storage with hashing, creation/revocation UI, an auth path next to the JWT one) and creates a new secret to protect. Not recommended before Option A is proven.

### Option D — Re-enable legacy email/password login for API clients

Not recommended: the app would have to collect passwords, Auth0 holds the password hashes (not MD5 anymore), and Auth0's Resource Owner Password grant is discouraged and disabled by default.

## Suggested next steps

1. Maintainers: pick A (or B) and create the Auth0 Native application; share client ID and domain with the developer.
2. Developer: implement PKCE login, and call `POST /api/v2/postTrack` to validate the end-to-end flow.
3. Maintainers: add further `/api/v2/*` endpoints as needed, and document them in [API.md](./API.md).
