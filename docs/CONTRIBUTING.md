# Contribution Guidelines

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This document proposes guidelines for contributing to the Openwhyd repository.

The objectives of the guidelines are:

- Make sure that contributing is an enjoyable experience, and that contributors are respected. (e.g. avoid endless discussions and flame wars)
- Make sure that the quality of the codebase increases over time. (or at least remains stable)
- Make sure that contributions solve more problems than they create. (e.g. a "fix" that was not tested properly will cause long discussions)
- Make sure to not wasting other contributors' time.

These are just guidelines, not rules, use your best judgment and feel free to propose changes to this document in a pull request.

## What to contribute

You can contribute to Openwhyd in various ways:

- Fix bugs or contribute to the development of features on which help is wanted: [see our To Do list](https://github.com/openwhyd/openwhyd/projects/1?card_filter_query=label%3A%22help+wanted%22)
- Submit Github issues for bugs you (or other users) found on openwhyd.org ([good example](https://github.com/openwhyd/openwhyd/issues/65))
- Give feedback and/or provide value in ongoing discussions in [issues](https://github.com/openwhyd/openwhyd/issues) and [pull requests](https://github.com/openwhyd/openwhyd/pulls)
- [Become a backer / donate](https://opencollective.com/openwhyd#support) to help us cover openwhyd.org's hosting fees
- Read more in the FAQ about [other ways to help the Openwhyd project](https://github.com/openwhyd/openwhyd/blob/main/docs/FAQ.md#id-love-to-contribute-to-openwhyd-how-can-i-help)

> **Working on your first Pull Request?** You can learn how from this _free_ series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github). And don't hesitate to ask for assistance by posting a message in any of the Github issues that you would like to contribute to.

## How to contribute to the code base

1. Fork and clone the [openwhyd repository](https://github.com/openwhyd/openwhyd), and make sure it runs properly on your computer (see our [install guide](./INSTALL.md))
2. Inform other contributors that you intend to contribute by posting a comment to the Github issue of your choice. Don't hesitate to ask questions if needed.
3. Make changes in your local copy of the code, run [automated tests](https://github.com/openwhyd/openwhyd#testing), commit, then [submit a Pull Request](https://github.com/openwhyd/openwhyd/compare) ([good example of PR for fixing a bug, with automated tests](https://github.com/openwhyd/openwhyd/pull/68))
4. Wait for your PR to be reviewed and merged into the `main` branch of Openwhyd's repository
5. Be available to reply if a contributor gets involved in the reviewing process of your PR.

## Acceptance criteria for Pull Requests (PR)

- A PR must address just one Github issue. Any PR that address zero or more than one Github issue (e.g. "cleaned .gitignore and added installation guide" are two independant PR) will be rejected.
- A PR must not break any functionality of the product. Every precaution (e.g. writing and running automated tests) must be taken to avoid that.

## CI/CD and Automated Tests

Our CI pipeline runs automatically on all pull requests and pushes to the main branch. Here's what you need to know:

### Tests that run on all PRs

These tests will run regardless of whether your PR comes from a fork or the main repository:
- **Dependencies check**: Validates npm dependencies and runs `npm audit`
- **Code checks**: Runs linting and build checks
- **Unit tests**: Tests individual components and functions
- **Functional tests**: Tests core functionality
- **Integration tests**: Tests API endpoints and database interactions
- **Approval tests**: Tests main routes, hot tracks, and posting
- **Docker tests**: Validates the Docker setup

### Tests that require secrets (may be skipped on fork PRs)

For security reasons, some tests require secrets that are only available to PRs from the main repository or maintainer branches:
- **Third-party tests**: Tests Algolia integration (requires API keys)
- **Cypress E2E tests**: Full E2E tests run on all PRs, but recording to Cypress Dashboard only happens when secrets are available
- **Auth tests**: Tests Auth0 authentication flow (requires Auth0 credentials)
- **Coverage reporting**: Code coverage is reported to Codacy when secrets are available

**For contributors from forks**: Don't worry if you see some tests skipped or if Cypress tests don't record to the dashboard. Maintainers will ensure these tests pass before merging your PR.

**For maintainers**: When reviewing PRs from forks, you may want to create a branch in the main repository to run the full test suite with secrets.

## Core principles

More generally, make sure to follow these three principles:

- Keep your PRs short
- Keep your PRs simple
- Avoid submitting PRs that may cause long discussions with the PR reviewer and/or other contributors

🤗 Beginners, you are welcome too! Don't be afraid, sending a PR is a great way to learn. You will probably be reassured by this article: [How To Win Friends And Make Pull Requests On GitHub](http://readwrite.com/2014/07/02/github-pull-request-etiquette/), and don't hesitate to ask for help.

## Code guidelines

- Optimize for search: [Like in the React.js project](https://facebook.github.io/react/contributing/design-principles.html), we want to make it easy for contributors to search for symbols (constants, variables and function names). So don't hesitate to give them verbose/specific names.

## Project Structure

- **app** API endpoints and backend codes
- **config** Database initialization scripts, http routes, and other configuration files
- **cypress** End-to-End tests
- **docs** API documentation and other references documents
- **misc** Code of browser extension
- **public** Frontend assets: images, css, js files
- **scripts** Utilities for production and data analatics
- **test** Integration and unit tests

Note: The player code is hosted at [playemJS](https://github.com/adrienjoly/playemjs).

## Contact information

You can contact Adrien Joly by email at: `contact at openwhyd dot org`.
