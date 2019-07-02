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
