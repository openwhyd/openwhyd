# CI Secrets and Fork PR Handling

This document explains how the Openwhyd CI/CD pipeline handles secrets and pull requests from forks (including dependabot PRs).

## Background

GitHub Actions has security restrictions that prevent secrets from being exposed to pull requests from forks. This is a security feature to prevent malicious PRs from stealing secrets. However, this means some CI jobs that require secrets will fail on fork PRs.

## Solution Implemented

We've updated the CI workflow to gracefully handle missing secrets by:

1. **Conditionally running jobs**: Jobs requiring secrets only run when secrets are available
2. **Disabling optional features**: Features like Cypress Dashboard recording are disabled when secrets unavailable
3. **Graceful error handling**: Missing artifacts are handled with `continue-on-error`

## How It Works

### Condition Pattern

Most jobs use this condition to check if secrets are available:

```yaml
if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository
```

This evaluates to `true` when:
- The event is a push to main (not a PR)
- The PR is from a branch in the main repository (not a fork)

It evaluates to `false` when:
- The PR is from a fork (including dependabot PRs from dependabot's fork)

### Jobs Affected

| Job | Behavior on Fork PRs | Secrets Required |
|-----|---------------------|------------------|
| `dependencies` | ✅ Runs normally | None |
| `code-checks` | ✅ Runs normally | None |
| `approval-tests` | ✅ Runs normally | None |
| `unit-tests` | ✅ Runs normally | None |
| `functional-tests` | ✅ Runs normally | None |
| `integration-tests` | ✅ Runs normally | None |
| `docker` | ✅ Runs normally | None |
| `third-party-tests` | ⏭️ Skipped | `ALGOLIA_TEST_APP_ID`, `ALGOLIA_TEST_API_KEY` |
| `cypress-tests` | ⚠️ Runs without recording | `CYPRESS_RECORD_KEY`, `APPLITOOLS_API_KEY` |
| `auth-tests` | ⏭️ Skipped | `CYPRESS_RECORD_KEY`, `AUTH0_*` secrets |
| `coverage` | ⏭️ Skipped | `CODACY_REPOSITORY_TOKEN_FOR_COVERAGE` |
| `release` | ⏭️ Only runs on push to main | `GH_TOKEN`, `DOCKER_HUB_*` |

Legend:
- ✅ Runs normally: Job executes completely
- ⏭️ Skipped: Job doesn't run
- ⚠️ Runs with limitations: Job runs but with reduced functionality

## For Contributors (Fork PRs)

If you're submitting a PR from a fork, don't worry if you see:
- Some tests marked as "skipped"
- Cypress tests not recording to the dashboard
- Missing coverage reports

This is expected behavior. Maintainers will ensure all tests pass before merging.

## For Maintainers

To run the full test suite with secrets on a fork PR:

1. Create a new branch in the main repository based on the fork's branch:
   ```bash
   git fetch origin pull/[PR_NUMBER]/head:pr-[PR_NUMBER]
   git push origin pr-[PR_NUMBER]
   ```

2. The CI will run with full access to secrets on this branch

3. After tests pass, you can merge the original PR

## Secrets Required

Here's a complete list of secrets used in CI:

- `ALGOLIA_TEST_APP_ID`: Algolia search API application ID
- `ALGOLIA_TEST_API_KEY`: Algolia search API key
- `APPLITOOLS_API_KEY`: Visual testing with Applitools
- `CYPRESS_RECORD_KEY`: Cypress Dashboard recording key
- `AUTH0_ISSUER_BASE_URL`: Auth0 authentication issuer URL
- `AUTH0_CLIENT_ID`: Auth0 client ID
- `AUTH0_CLIENT_SECRET`: Auth0 client secret
- `AUTH0_SECRET`: Auth0 secret for session encryption
- `CODACY_REPOSITORY_TOKEN_FOR_COVERAGE`: Codacy coverage reporting token
- `GH_TOKEN`: GitHub token for creating releases
- `DOCKER_HUB_USERNAME`: Docker Hub username for publishing images
- `DOCKER_HUB_ACCESS_TOKEN`: Docker Hub access token

## Testing Changes to CI

To test changes to the CI workflow:

1. Make changes in a feature branch
2. Open a PR to see how it behaves on PRs
3. Check both fork and non-fork scenarios if possible
4. Review the GitHub Actions logs to ensure jobs run/skip as expected

## References

- [GitHub Actions: Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions: Security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Dependabot and GitHub Actions](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
