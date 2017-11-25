# Contribution Guidelines

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This document proposes guidelines for contributing to the OpenWhyd repository.

The objectives of the guidelines are:

- Make sure that contributing is an enjoyable experience, and that contributors are respected. (e.g. avoid endless discussions and flame wars)
- Make sure that the quality of the codebase increases over time. (or at least remains stable)
- Make sure that contributions solve more problems than they create. (e.g. a "fix" that was not tested properly will cause long discussions)
- Make sure to not wasting other contributors' time.

These are just guidelines, not rules, use your best judgment and feel free to propose changes to this document in a pull request.

## What to contribute

You can contribute to Openwhyd in various ways:

- Submit Github issues for bugs you (or other users) found on openwhyd.org ([good example](https://github.com/openwhyd/openwhyd/issues/65))
- Give feedback and/or provide value in ongoing discussions in [issues](https://github.com/openwhyd/openwhyd/issues) and [pull requests](https://github.com/openwhyd/openwhyd/pulls)
- Fix [existing bugs](https://github.com/openwhyd/openwhyd/projects/1?card_filter_query=label%3A%22help+wanted%22+bug)
- [Become a backer / donate](https://opencollective.com/openwhyd#support) to help us cover openwhyd.org's hosting fees
- Read more in the FAQ about [other ways to help the Openwhyd project](https://github.com/openwhyd/openwhyd/blob/master/docs/FAQ.md#id-love-to-contribute-to-openwhyd-how-can-i-help)

## How to contribute to the code base

0. Setup your environment to match prerequisites and nodejs/npm versions specified in package.json
1. Clone openwhyd, and make sure it runs properly on your environment
2. Assign the Github issue you're working on (after creating it, if necessary) to yourself ([good example of Github issue for a bug](https://github.com/openwhyd/openwhyd/issues/65))
3. Make changes in your local copy of the code, run [automated tests](https://github.com/openwhyd/openwhyd#testing), commit, then [submit a Pull Request](https://github.com/openwhyd/openwhyd/compare) ([good example of PR for fixing a bug, with automated tests](https://github.com/openwhyd/openwhyd/pull/68))
4. Wait for your PR to be reviewed and merged into the `master` branch of Openwhyd's repository
5. Be available to reply if a contributor gets involved in the reviewing process of your PR.

## Acceptance criteria for Pull Requests (PR)

- A PR must contain only one modification. Any PR with more than one independant modification will be rejected. (e.g. "cleaned .gitignore and added installation guide" are two independant PR)
- A PR must solve an identified and immediate problem. Any PR that intends to solve a future problem will be rejected. (e.g. "added a rule for running tests", even though there are no tests yet in the project)
- A PR must be tested on the same environment as the production server (including nodejs/npm versions) before being submitted. Make sure to clone your PR and rebuild it from scratch to make sure that it does not cause problems with dependencies and/or the build chain.
- A PR must not break any functionality of the product. Every precaution (e.g. writing and running automated tests) must be taken to avoid that.

## Core principles

More generally, make sure to follow these three principles:
- Keep your PRs short
- Keep your PRs simple
- Avoid submitting PRs that may cause long discussions with the PR reviewer and/or other contributors

🤗 Beginners, you are welcome too! Don't be afraid, sending a PR is a great way to learn. You will probably be reassured by this article: [How To Win Friends And Make Pull Requests On GitHub](http://readwrite.com/2014/07/02/github-pull-request-etiquette/).

## Code guidelines

- Optimize for search: [Like in the React.js project](https://facebook.github.io/react/contributing/design-principles.html), we want to make it easy for contributors to search for symbols (constants, variables and function names. So don't hesitate to give them verbose/specific names.
