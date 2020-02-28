## [1.21.1](https://github.com/openwhyd/openwhyd/compare/v1.21.0...v1.21.1) (2020-02-28)


### Bug Fixes

* **#212:** user can add tracks thanks to new google api account for youtube ([#264](https://github.com/openwhyd/openwhyd/issues/264)) ([6da7db7](https://github.com/openwhyd/openwhyd/commit/6da7db7)), closes [#212](https://github.com/openwhyd/openwhyd/issues/212) [#262](https://github.com/openwhyd/openwhyd/issues/262) [#263](https://github.com/openwhyd/openwhyd/issues/263)
* **#262:** user can add YouTube tracks (when new keys are active) ([c1d7a85](https://github.com/openwhyd/openwhyd/commit/c1d7a85)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#262](https://github.com/openwhyd/openwhyd/issues/262)

# [1.21.0](https://github.com/openwhyd/openwhyd/compare/v1.20.0...v1.21.0) (2019-12-01)


### Features

* **ci:** auto publish to docker hub, for [#233](https://github.com/openwhyd/openwhyd/issues/233) ([342b7af](https://github.com/openwhyd/openwhyd/commit/342b7af))

# [1.20.0](https://github.com/openwhyd/openwhyd/compare/v1.19.2...v1.20.0) (2019-12-01)


### Features

* **ci:** add a first Cypress.js test ([#197](https://github.com/openwhyd/openwhyd/issues/197)) ([9c4bd77](https://github.com/openwhyd/openwhyd/commit/9c4bd77)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.19.2](https://github.com/openwhyd/openwhyd/compare/v1.19.1...v1.19.2) (2019-12-01)


### Bug Fixes

* **ci:** use node version 10 on github actions ([#254](https://github.com/openwhyd/openwhyd/issues/254)) ([9caed80](https://github.com/openwhyd/openwhyd/commit/9caed80))

## [1.19.1](https://github.com/openwhyd/openwhyd/compare/v1.19.0...v1.19.1) (2019-12-01)


### Bug Fixes

* **github:** make GitHub actions workflow support "skip ci" ([e77fe32](https://github.com/openwhyd/openwhyd/commit/e77fe32))

# [1.19.0](https://github.com/openwhyd/openwhyd/compare/v1.18.1...v1.19.0) (2019-12-01)


### Bug Fixes

* generate separate user credentials for each test ([bfd06b3](https://github.com/openwhyd/openwhyd/commit/bfd06b3))
* use hex representation of argon2 pwd, when storing in db ([4a15ac7](https://github.com/openwhyd/openwhyd/commit/4a15ac7))


### Features

* **security:** use argon2 to hash user password on sign up ([6978a3e](https://github.com/openwhyd/openwhyd/commit/6978a3e))

## [1.18.1](https://github.com/openwhyd/openwhyd/compare/v1.18.0...v1.18.1) (2019-11-24)


### Bug Fixes

* **tests:** homogenize returns of api client ([#251](https://github.com/openwhyd/openwhyd/issues/251)) ([a746b51](https://github.com/openwhyd/openwhyd/commit/a746b51))

# [1.18.0](https://github.com/openwhyd/openwhyd/compare/v1.17.3...v1.18.0) (2019-11-23)


### Features

* **security:** add rate limiting to POST requests ([#249](https://github.com/openwhyd/openwhyd/issues/249)) ([eedb462](https://github.com/openwhyd/openwhyd/commit/eedb462))

## [1.17.3](https://github.com/openwhyd/openwhyd/compare/v1.17.2...v1.17.3) (2019-11-23)


### Bug Fixes

* **maintenance:** syntax error on sed regex, in production ([db5ab93](https://github.com/openwhyd/openwhyd/commit/db5ab93))

## [1.17.2](https://github.com/openwhyd/openwhyd/compare/v1.17.1...v1.17.2) (2019-11-23)


### Bug Fixes

* **maintenance:** use sudo to store nginx config ([9d9283e](https://github.com/openwhyd/openwhyd/commit/9d9283e))

## [1.17.1](https://github.com/openwhyd/openwhyd/compare/v1.17.0...v1.17.1) (2019-11-23)


### Bug Fixes

* **maintenance:** sudo the nginx config generation ([38ebe59](https://github.com/openwhyd/openwhyd/commit/38ebe59))

# [1.17.0](https://github.com/openwhyd/openwhyd/compare/v1.16.0...v1.17.0) (2019-11-23)


### Features

* **maintenance:** restart script generates nginx config from template ([#248](https://github.com/openwhyd/openwhyd/issues/248)) ([efa8296](https://github.com/openwhyd/openwhyd/commit/efa8296))

# [1.16.0](https://github.com/openwhyd/openwhyd/compare/v1.15.4...v1.16.0) (2019-10-27)


### Features

* **scripts:** use "npm start" instead of "npm run run" to start the server ([#245](https://github.com/openwhyd/openwhyd/issues/245)) ([1540581](https://github.com/openwhyd/openwhyd/commit/1540581))

## [1.15.4](https://github.com/openwhyd/openwhyd/compare/v1.15.3...v1.15.4) (2019-10-27)


### Bug Fixes

* **doc:** simplify INSTALL instructions + rename npm scripts for docker ([#244](https://github.com/openwhyd/openwhyd/issues/244)) ([61c9e48](https://github.com/openwhyd/openwhyd/commit/61c9e48))

## [1.15.3](https://github.com/openwhyd/openwhyd/compare/v1.15.2...v1.15.3) (2019-10-27)


### Bug Fixes

* **db:** fix db auth problem in production ([#240](https://github.com/openwhyd/openwhyd/issues/240)) ([6353b52](https://github.com/openwhyd/openwhyd/commit/6353b52))

## [1.15.2](https://github.com/openwhyd/openwhyd/compare/v1.15.1...v1.15.2) (2019-10-27)


### Bug Fixes

* **privacy:** don't log email addresses and password hashes ([#239](https://github.com/openwhyd/openwhyd/issues/239)) ([aa187e0](https://github.com/openwhyd/openwhyd/commit/aa187e0))

## [1.15.1](https://github.com/openwhyd/openwhyd/compare/v1.15.0...v1.15.1) (2019-10-26)


### Bug Fixes

* **deps:** fix bundle gemfile for docs ([#238](https://github.com/openwhyd/openwhyd/issues/238)) ([036037f](https://github.com/openwhyd/openwhyd/commit/036037f))

# [1.15.0](https://github.com/openwhyd/openwhyd/compare/v1.14.5...v1.15.0) (2019-10-26)


### Features

* **dev:** script to import a user's posts from production, for [#220](https://github.com/openwhyd/openwhyd/issues/220) ([#235](https://github.com/openwhyd/openwhyd/issues/235)) ([9c6164f](https://github.com/openwhyd/openwhyd/commit/9c6164f))

## [1.14.5](https://github.com/openwhyd/openwhyd/compare/v1.14.4...v1.14.5) (2019-10-26)


### Bug Fixes

* **mongodb:** prevent "db.collections is not a function" error ([#232](https://github.com/openwhyd/openwhyd/issues/232)) ([2c353ca](https://github.com/openwhyd/openwhyd/commit/2c353ca))

## [1.14.4](https://github.com/openwhyd/openwhyd/compare/v1.14.3...v1.14.4) (2019-10-14)


### Bug Fixes

* **eslint:** support ES6 and ES2017 syntax ([#231](https://github.com/openwhyd/openwhyd/issues/231)) ([04f270f](https://github.com/openwhyd/openwhyd/commit/04f270f))

## [1.14.3](https://github.com/openwhyd/openwhyd/compare/v1.14.2...v1.14.3) (2019-10-13)


### Bug Fixes

* **lint:** use prettier config in ESLint + apply fixes ([#230](https://github.com/openwhyd/openwhyd/issues/230)) ([12ba8ca](https://github.com/openwhyd/openwhyd/commit/12ba8ca))

## [1.14.2](https://github.com/openwhyd/openwhyd/compare/v1.14.1...v1.14.2) (2019-10-01)


### Bug Fixes

* **deps:** update to wdio 5 (webdriver.io) ([#229](https://github.com/openwhyd/openwhyd/issues/229)) ([de28437](https://github.com/openwhyd/openwhyd/commit/de28437))

## [1.14.1](https://github.com/openwhyd/openwhyd/compare/v1.14.0...v1.14.1) (2019-09-24)


### Bug Fixes

* render image with no path for sendFile (uploadFile.js) ([#225](https://github.com/openwhyd/openwhyd/issues/225)) ([839ee02](https://github.com/openwhyd/openwhyd/commit/839ee02)), closes [#213](https://github.com/openwhyd/openwhyd/issues/213)

# [1.14.0](https://github.com/openwhyd/openwhyd/compare/v1.13.0...v1.14.0) (2019-09-08)


### Features

* **ci:** add badge to GitHub Actions CI Workflow ([#219](https://github.com/openwhyd/openwhyd/issues/219)) ([3bfa059](https://github.com/openwhyd/openwhyd/commit/3bfa059)), closes [#217](https://github.com/openwhyd/openwhyd/issues/217)

# [1.13.0](https://github.com/openwhyd/openwhyd/compare/v1.12.0...v1.13.0) (2019-09-08)


### Features

* **ci:** move semantic-release to github-actions workflow ([#216](https://github.com/openwhyd/openwhyd/issues/216)) ([53387e7](https://github.com/openwhyd/openwhyd/commit/53387e7)), closes [#205](https://github.com/openwhyd/openwhyd/issues/205) [#215](https://github.com/openwhyd/openwhyd/issues/215)

# [1.12.0](https://github.com/openwhyd/openwhyd/compare/v1.11.3...v1.12.0) (2019-09-01)


### Features

* **ci:** run CI/tests on GitHub Actions ([#215](https://github.com/openwhyd/openwhyd/issues/215)) ([8886a82](https://github.com/openwhyd/openwhyd/commit/8886a82)), closes [#205](https://github.com/openwhyd/openwhyd/issues/205)

## [1.11.3](https://github.com/openwhyd/openwhyd/compare/v1.11.2...v1.11.3) (2019-08-29)


### Bug Fixes

* typo on gdpr consent screen ([#214](https://github.com/openwhyd/openwhyd/issues/214)) ([978b5f8](https://github.com/openwhyd/openwhyd/commit/978b5f8))

## [1.11.2](https://github.com/openwhyd/openwhyd/compare/v1.11.1...v1.11.2) (2019-07-14)


### Bug Fixes

* **sessions:** define maxAge in the cookie property ([#210](https://github.com/openwhyd/openwhyd/issues/210)) ([6d3ffbb](https://github.com/openwhyd/openwhyd/commit/6d3ffbb)), closes [#209](https://github.com/openwhyd/openwhyd/issues/209)

## [1.11.1](https://github.com/openwhyd/openwhyd/compare/v1.11.0...v1.11.1) (2019-07-14)


### Bug Fixes

* **sessions:** make user cookie persistant ([#209](https://github.com/openwhyd/openwhyd/issues/209)) ([bba528d](https://github.com/openwhyd/openwhyd/commit/bba528d))

# [1.11.0](https://github.com/openwhyd/openwhyd/compare/v1.10.0...v1.11.0) (2019-07-03)


### Features

* **back-end:** migrate from "my/http" to Express.js - part 3 ([#204](https://github.com/openwhyd/openwhyd/issues/204)) ([00e4db2](https://github.com/openwhyd/openwhyd/commit/00e4db2)), closes [#122](https://github.com/openwhyd/openwhyd/issues/122) [#122](https://github.com/openwhyd/openwhyd/issues/122)

# [1.10.0](https://github.com/openwhyd/openwhyd/compare/v1.9.0...v1.10.0) (2019-07-03)


### Features

* **back-end:** migrate from "my/http" to Express.js ([#201](https://github.com/openwhyd/openwhyd/issues/201)) ([41559fd](https://github.com/openwhyd/openwhyd/commit/41559fd)), closes [#122](https://github.com/openwhyd/openwhyd/issues/122) [#122](https://github.com/openwhyd/openwhyd/issues/122)

# [1.9.0](https://github.com/openwhyd/openwhyd/compare/v1.8.0...v1.9.0) (2019-07-02)


### Bug Fixes

* add express dependency, so tests can run ([3bdf6bf](https://github.com/openwhyd/openwhyd/commit/3bdf6bf))


### Features

* use local version of cookieconsent plug-in, instead of cdn ([c856972](https://github.com/openwhyd/openwhyd/commit/c856972))
* **tests:** run « get » tests against local web server instead of openwhyd.org and google.com ([653415b](https://github.com/openwhyd/openwhyd/commit/653415b))

# [1.8.0](https://github.com/openwhyd/openwhyd/compare/v1.7.2...v1.8.0) (2019-06-29)


### Features

* **api:** migrate from my/session to express-session and connect-mongo ([#200](https://github.com/openwhyd/openwhyd/issues/200)) ([0a18c5b](https://github.com/openwhyd/openwhyd/commit/0a18c5b)), closes [#122](https://github.com/openwhyd/openwhyd/issues/122) [#55](https://github.com/openwhyd/openwhyd/issues/55)

## [1.7.2](https://github.com/openwhyd/openwhyd/compare/v1.7.1...v1.7.2) (2019-06-09)


### Bug Fixes

* **ui:** fix position of barelog/productfeed badge ([3ac90e6](https://github.com/openwhyd/openwhyd/commit/3ac90e6))

## [1.7.1](https://github.com/openwhyd/openwhyd/compare/v1.7.0...v1.7.1) (2019-06-09)


### Bug Fixes

* append PORT to URL_PREFIX only if WHYD_URL_PREFIX is not provided ([#198](https://github.com/openwhyd/openwhyd/issues/198)) ([e63ee79](https://github.com/openwhyd/openwhyd/commit/e63ee79)), closes [/github.com/openwhyd/openwhyd/commit/cc3af51b2d24e98d24e10583add56ab83bd535de#commitcomment-33865126](https://github.com//github.com/openwhyd/openwhyd/commit/cc3af51b2d24e98d24e10583add56ab83bd535de/issues/commitcomment-33865126)

# [1.7.0](https://github.com/openwhyd/openwhyd/compare/v1.6.2...v1.7.0) (2019-06-04)


### Features

* **admin:** add scripts to backup and delete a user ([382e562](https://github.com/openwhyd/openwhyd/commit/382e562))

## [1.6.2](https://github.com/openwhyd/openwhyd/compare/v1.6.1...v1.6.2) (2019-05-30)


### Bug Fixes

* **youtube:** revert to previous YouTube account, for [#190](https://github.com/openwhyd/openwhyd/issues/190) ([32446c9](https://github.com/openwhyd/openwhyd/commit/32446c9))

## [1.6.1](https://github.com/openwhyd/openwhyd/compare/v1.6.0...v1.6.1) (2019-05-26)


### Bug Fixes

* **youtube:** switch to new YouTube account, for [#190](https://github.com/openwhyd/openwhyd/issues/190) ([8c8802b](https://github.com/openwhyd/openwhyd/commit/8c8802b))

# [1.6.0](https://github.com/openwhyd/openwhyd/compare/v1.5.0...v1.6.0) (2019-04-30)


### Bug Fixes

* clarify use of environment variables in app.js ([cc3af51](https://github.com/openwhyd/openwhyd/commit/cc3af51))


### Features

* add script to print dates of playlog files ([68c2114](https://github.com/openwhyd/openwhyd/commit/68c2114))

# [1.5.0](https://github.com/openwhyd/openwhyd/compare/v1.4.9...v1.5.0) (2019-04-03)


### Features

* add timestamp to anonymised playlog entries ([45caf45](https://github.com/openwhyd/openwhyd/commit/45caf45)), closes [#83](https://github.com/openwhyd/openwhyd/issues/83)
* can anonymise playlog with timestamps or ObjectIDs ([461623b](https://github.com/openwhyd/openwhyd/commit/461623b)), closes [#83](https://github.com/openwhyd/openwhyd/issues/83)

## [1.4.9](https://github.com/openwhyd/openwhyd/compare/v1.4.8...v1.4.9) (2019-03-03)


### Bug Fixes

* **routing:** add redirection routes with tracking ([71a6b58](https://github.com/openwhyd/openwhyd/commit/71a6b58))

## [1.4.8](https://github.com/openwhyd/openwhyd/compare/v1.4.7...v1.4.8) (2019-01-27)


### Bug Fixes

* **email-notif:** ability to unsubscribe from notification emails ([#186](https://github.com/openwhyd/openwhyd/issues/186)) ([#187](https://github.com/openwhyd/openwhyd/issues/187)) ([12af968](https://github.com/openwhyd/openwhyd/commit/12af968))

## [1.4.7](https://github.com/openwhyd/openwhyd/compare/v1.4.6...v1.4.7) (2018-12-27)


### Bug Fixes

* **embed:** change logo and adjust css attributes ([#185](https://github.com/openwhyd/openwhyd/issues/185)) ([fcbede5](https://github.com/openwhyd/openwhyd/commit/fcbede5))

## [1.4.6](https://github.com/openwhyd/openwhyd/compare/v1.4.5...v1.4.6) (2018-12-27)


### Bug Fixes

* **embed:** replace old logo and adjust css styling ([c3865ce](https://github.com/openwhyd/openwhyd/commit/c3865ce)), closes [#183](https://github.com/openwhyd/openwhyd/issues/183) [#184](https://github.com/openwhyd/openwhyd/issues/184) [#185](https://github.com/openwhyd/openwhyd/issues/185)

## [1.4.5](https://github.com/openwhyd/openwhyd/compare/v1.4.4...v1.4.5) (2018-12-08)


### Bug Fixes

* **deps:** upgrade cryptiles dependency, thanks to `npm audit fix` ([63899ff](https://github.com/openwhyd/openwhyd/commit/63899ff))
* **deps:** upgrade object-sizeof dependency, thanks to `npm audit fix —force` ([ad0ab70](https://github.com/openwhyd/openwhyd/commit/ad0ab70))
* **docker:** also use node 8 in dockerfile ([f59efe7](https://github.com/openwhyd/openwhyd/commit/f59efe7))

## [1.4.4](https://github.com/openwhyd/openwhyd/compare/v1.4.3...v1.4.4) (2018-10-27)


### Bug Fixes

* **security:** disable email invites ([#180](https://github.com/openwhyd/openwhyd/issues/180)) ([26effca](https://github.com/openwhyd/openwhyd/commit/26effca)), closes [#178](https://github.com/openwhyd/openwhyd/issues/178)

## [1.4.3](https://github.com/openwhyd/openwhyd/compare/v1.4.2...v1.4.3) (2018-10-14)


### Bug Fixes

* **vimeo:** fix auto-playback of vimeo tracks, thanks to [@mauricesvay](https://github.com/mauricesvay) ([#175](https://github.com/openwhyd/openwhyd/issues/175)) ([adf5e52](https://github.com/openwhyd/openwhyd/commit/adf5e52))

## [1.4.2](https://github.com/openwhyd/openwhyd/compare/v1.4.1...v1.4.2) (2018-09-17)


### Bug Fixes

* path problem in makefile ([61f6a55](https://github.com/openwhyd/openwhyd/commit/61f6a55))
* path problem in restart script ([d10ba65](https://github.com/openwhyd/openwhyd/commit/d10ba65))
* start script ([6c5239d](https://github.com/openwhyd/openwhyd/commit/6c5239d))

## [1.4.1](https://github.com/openwhyd/openwhyd/compare/v1.4.0...v1.4.1) (2018-09-16)


### Bug Fixes

* **contributors:** fix contributors’ avatars in README ([e4dcb40](https://github.com/openwhyd/openwhyd/commit/e4dcb40))
