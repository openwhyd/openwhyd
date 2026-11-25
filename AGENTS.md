# AGENTS.md

Guidelines for AI agents (and humans) changing Openwhyd. See also [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

- [Running and testing locally](#running-and-testing-locally)
- [CI](#ci)
- [Security: user data and files](#security-user-data-and-files)
- [API error responses](#api-error-responses)
- [Logging (stderr triggers Datadog notifications)](#logging-stderr-triggers-datadog-notifications)
- [Client code](#client-code)
- [Pull requests](#pull-requests)

## Running and testing locally

- Unit tests (no db needed): `npm run test:unit`. Lint: `make lint`, or `npx eslint <files>`, `npx prettier --check <files>` and `npx tsc --noEmit -p .` on changed files.
- API tests (`npm run test:api`) start their own server on port 8080, and `test/api-client.js` hardcodes that port. If the `openwhyd-web-1` container is running, test local changes by rebuilding it instead: `docker compose up --detach --build web`, then check that the container runs the new code (e.g. `docker exec openwhyd-web-1 grep -c <new identifier> /usr/src/app/<file>`), as a recreate can silently keep the old image.
- Cypress: `CYPRESS_SKIP_APPLITOOLS_TESTS=true node_modules/.bin/cypress run --spec cypress/e2e/<spec>.ts` against the container. `public/` is baked into the image, so rebuild it after client changes. Delete `cypress/screenshots` and `cypress/videos` afterwards (they are not git-ignored).
- The test db (`openwhyd_test`, mongo on port 27117) is reset by tests: don't keep data you care about there.
- For a regression test, run it once without the fix (e.g. `git stash push -- <files>`) to prove that it catches the bug.

## CI

- Cypress jobs pin the Chrome version in `.github/workflows/ci.yml`. If they fail with `Error: * is not a valid URL` while all tests pass, a new Chrome version broke Cypress: compare the `Browser:` versions with the last green run on `main`.
- Codacy flags the lines you touch, including existing code: `==`, assignments in conditions (e.g. `--x === 0`), functions mixing `return x` and `return`. Get its issues with `curl "https://app.codacy.com/api/v3/analysis/organizations/gh/openwhyd/repositories/openwhyd/pull-requests/<PR>/issues?status=new"`.
- API tests run in CI ("Integration tests" and "Docker tests" jobs): rely on them when running them locally is not possible.

## Security: user data and files

- A user can only read, move or delete files they own. Never infer ownership from a file's existence or name at the destination: check it against the requesting user (`uploadCtr.isUploadedBy()`) or the db.
- Uploaded files are named `<uId>_<random>_<dims>` (`makeUploadedFileName()`), and `renameTo()` / `moveTo()` require the uploader's id.
- Paths received from clients: take their `path.basename()`, and restrict them to the expected directory (`actualFilePath(path, allowedDirs)`).
- Fields set by clients (e.g. `img`, `cvrImg`) must not store arbitrary values: normalize them.
- `/img/u/<uid>` exposes `user.img`, so image file names are public: they are not secrets.

## API error responses

- API endpoints must never return technical details: no `Error` objects, `err.message`, db errors, file paths or error codes.
- Return only user-facing messages, listed in a `USER_FACING_ERRORS` allowlist, through `sanitizeApiResponse()` (`app/controllers/api/safeApiErrors.js`). Any other error becomes a generic message, and is logged with details.
- Legacy endpoints (e.g. `/api/user`) respond HTTP 200 with `{ error }`: client code must check `result.error`, not only the HTTP status.

## Logging (stderr triggers Datadog notifications)

- Log each failure once, on a single line, with context (endpoint, uId, file). No `console.trace`, no multi-line objects.
- Use `console.error` only for errors that need attention. Use `console.warn` or `console.log` for expected cases (user errors, duplicate requests, rejected uploads).
- Don't swallow errors from child processes (e.g. `gm`): log their stderr, and pass the error to the caller.
- When investigating in Datadog: full-text search doesn't match inside tokens (`abc` won't find `abc_180x`). Use "View in context" on a log line to see the surrounding request.

## Client code

jQuery dialogs in `public/html/dlg*.html` and scripts in `public/js/`:

- Prevent duplicate submissions: disable "Save" while a request is pending.
- A failed operation must not change the user's current selection (e.g. a failed upload must not select the default image).
- Only delete temporary uploads once their replacement succeeded, or when the dialog is closed without saving.

## Pull requests

- Follow `.github/pull_request_template.md`, and keep the PR description in sync when the approach changes.
- Answer automated reviews (e.g. Greptile) in their thread, saying what was fixed and how it's tested.
