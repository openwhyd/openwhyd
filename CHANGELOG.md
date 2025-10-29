## [1.63.36](https://github.com/openwhyd/openwhyd/compare/v1.63.35...v1.63.36) (2025-10-29)


### Bug Fixes

* **public-api:** add endpoints to fetch public user info ([#853](https://github.com/openwhyd/openwhyd/issues/853)) ([fef2926](https://github.com/openwhyd/openwhyd/commit/fef2926547da86f2e13df7209f6a19fd45c110ea))

## [1.63.35](https://github.com/openwhyd/openwhyd/compare/v1.63.34...v1.63.35) (2025-10-29)


### Bug Fixes

* **mobile:** lead to m.openwhyd.org instead of openwhyd.github.io/openwhyd-mobile-web-client ([86cc8c1](https://github.com/openwhyd/openwhyd/commit/86cc8c11aa0350b1ac0acbf1bf4819345080ff74))

## [1.63.34](https://github.com/openwhyd/openwhyd/compare/v1.63.33...v1.63.34) (2025-10-12)


### Bug Fixes

* **api:** report errors in response instead of logs ([#851](https://github.com/openwhyd/openwhyd/issues/851)) ([21eb90d](https://github.com/openwhyd/openwhyd/commit/21eb90daeae346cd5e657989e8c84ff12c6d01c1))

## [1.63.33](https://github.com/openwhyd/openwhyd/compare/v1.63.32...v1.63.33) (2025-10-05)


### Bug Fixes

* **api:** json response for /all endpoint ([#849](https://github.com/openwhyd/openwhyd/issues/849)) ([e254bd7](https://github.com/openwhyd/openwhyd/commit/e254bd73377ca35c51330e231491c48c552cff28))

## [1.63.32](https://github.com/openwhyd/openwhyd/compare/v1.63.31...v1.63.32) (2025-10-04)


### Bug Fixes

* **e2e-tests:** use chrome to support window.open() + remove useless scrolling ([#850](https://github.com/openwhyd/openwhyd/issues/850)) ([aea4ea9](https://github.com/openwhyd/openwhyd/commit/aea4ea93c8d7c70564558877323055cfa9a5e21f))

## [1.63.31](https://github.com/openwhyd/openwhyd/compare/v1.63.30...v1.63.31) (2025-07-23)


### Bug Fixes

* **user-controller:** don't log error about handle validation ([#838](https://github.com/openwhyd/openwhyd/issues/838)) ([ccfaeb9](https://github.com/openwhyd/openwhyd/commit/ccfaeb950b9e29193c904a30e1d1fc5739bc8a65))

## [1.63.30](https://github.com/openwhyd/openwhyd/compare/v1.63.29...v1.63.30) (2025-07-06)


### Bug Fixes

* **email:** `[EMAIL] send error: Error: The subject field is required. #MS42209 (and 3 more errors)` ([#836](https://github.com/openwhyd/openwhyd/issues/836)) ([7bfaa0f](https://github.com/openwhyd/openwhyd/commit/7bfaa0fed3598ecaeb10d8ab8d068d424fd47f78)), closes [#MS42209](https://github.com/openwhyd/openwhyd/issues/MS42209)

## [1.63.29](https://github.com/openwhyd/openwhyd/compare/v1.63.28...v1.63.29) (2025-07-06)


### Bug Fixes

* **stream:** home feed should not end prematurely + fix Cypress tests on CI ([#835](https://github.com/openwhyd/openwhyd/issues/835)) ([8abc963](https://github.com/openwhyd/openwhyd/commit/8abc9637baf83f9b1b9bc04c613d1243f8da1021)), closes [/github.com/openwhyd/openwhyd/pull/835#issuecomment-3042009010](https://github.com//github.com/openwhyd/openwhyd/pull/835/issues/issuecomment-3042009010)

## [1.63.28](https://github.com/openwhyd/openwhyd/compare/v1.63.27...v1.63.28) (2025-06-25)


### Bug Fixes

* **db:** decommission legacy `forEach` mongodb helper ([#834](https://github.com/openwhyd/openwhyd/issues/834)) ([eca52af](https://github.com/openwhyd/openwhyd/commit/eca52afb6cb7b015aef3798737bacfffaeff1e0d))

## [1.63.27](https://github.com/openwhyd/openwhyd/compare/v1.63.26...v1.63.27) (2025-06-25)


### Bug Fixes

* **db:** decommission `forEach2` function ([#833](https://github.com/openwhyd/openwhyd/issues/833)) ([a59d25e](https://github.com/openwhyd/openwhyd/commit/a59d25ea520240f870bdb0fab47a26bfb85e9b3b))

## [1.63.26](https://github.com/openwhyd/openwhyd/compare/v1.63.25...v1.63.26) (2025-06-25)


### Bug Fixes

* **security:** prevent malicious redirection ([13fa45d](https://github.com/openwhyd/openwhyd/commit/13fa45d38ce63cb947cadd88ab5e8eeeae645eac))

## [1.63.25](https://github.com/openwhyd/openwhyd/compare/v1.63.24...v1.63.25) (2025-06-25)


### Bug Fixes

* **email:** send emails using mailersend instead of sendgrid ([#830](https://github.com/openwhyd/openwhyd/issues/830)) ([8bdb020](https://github.com/openwhyd/openwhyd/commit/8bdb020fbc693aec46bc78f39ae0dcec0b5b1fbc))

## [1.63.24](https://github.com/openwhyd/openwhyd/compare/v1.63.23...v1.63.24) (2025-06-11)


### Bug Fixes

* playlist ordering ([#832](https://github.com/openwhyd/openwhyd/issues/832)) ([4a6d2a9](https://github.com/openwhyd/openwhyd/commit/4a6d2a9b9775ec8c5a6ff13b9c9623b8239855b4))

## [1.63.23](https://github.com/openwhyd/openwhyd/compare/v1.63.22...v1.63.23) (2025-06-08)


### Bug Fixes

* **posts:** remove logs on `countPlaylistPosts` ([c041750](https://github.com/openwhyd/openwhyd/commit/c041750a769c573a3fd07c8138097e447cf422e7))

## [1.63.22](https://github.com/openwhyd/openwhyd/compare/v1.63.21...v1.63.22) (2025-06-07)


### Bug Fixes

* **cleanup:** remove old code: `collabId` (collaborative playlists) ([#829](https://github.com/openwhyd/openwhyd/issues/829)) ([564fe4a](https://github.com/openwhyd/openwhyd/commit/564fe4a912544b1ef15039020bcdffca354f5ff2))

## [1.63.21](https://github.com/openwhyd/openwhyd/compare/v1.63.20...v1.63.21) (2025-06-07)


### Bug Fixes

* **start-up:** remove old db migrations + count documents per collection ([#828](https://github.com/openwhyd/openwhyd/issues/828)) ([397e9df](https://github.com/openwhyd/openwhyd/commit/397e9dfa1f2c4846528ea2974eb5060e6f160168)), closes [/github.com/openwhyd/openwhyd/pull/828#discussion_r2133648973](https://github.com//github.com/openwhyd/openwhyd/pull/828/issues/discussion_r2133648973) [/github.com/openwhyd/openwhyd/pull/828#discussion_r2133648976](https://github.com//github.com/openwhyd/openwhyd/pull/828/issues/discussion_r2133648976)

## [1.63.20](https://github.com/openwhyd/openwhyd/compare/v1.63.19...v1.63.20) (2025-06-07)


### Bug Fixes

* **search:** redirect to home, when going to search page without query ([#827](https://github.com/openwhyd/openwhyd/issues/827)) ([3950b29](https://github.com/openwhyd/openwhyd/commit/3950b29f37c1d82e85903d4c0e168fb6276f6582))

## [1.63.19](https://github.com/openwhyd/openwhyd/compare/v1.63.18...v1.63.19) (2025-06-07)


### Bug Fixes

* **start-up:** print steps of db initialization + use promises ([#826](https://github.com/openwhyd/openwhyd/issues/826)) ([f2f5545](https://github.com/openwhyd/openwhyd/commit/f2f5545b35040c317d9deae4fe34cd3aca556746))

## [1.63.18](https://github.com/openwhyd/openwhyd/compare/v1.63.17...v1.63.18) (2025-06-07)


### Bug Fixes

* **search:** make search controller respond with posts ([#825](https://github.com/openwhyd/openwhyd/issues/825)) ([0695183](https://github.com/openwhyd/openwhyd/commit/0695183ce6bda4d858ece190009fe4fbbc64dd28))

## [1.63.17](https://github.com/openwhyd/openwhyd/compare/v1.63.16...v1.63.17) (2025-05-29)


### Bug Fixes

* **mobile:** use mobile track finder from github pages instead of glitch.me ([#823](https://github.com/openwhyd/openwhyd/issues/823)) ([08e1b0e](https://github.com/openwhyd/openwhyd/commit/08e1b0e7380ceb2dad9b9e9627c44478eb39589f))

## [1.63.16](https://github.com/openwhyd/openwhyd/compare/v1.63.15...v1.63.16) (2025-05-29)


### Bug Fixes

* **facebook:** remove facebook connect + link to iOS/iPhone app ([#822](https://github.com/openwhyd/openwhyd/issues/822)) ([6d5b1ac](https://github.com/openwhyd/openwhyd/commit/6d5b1accad5664be0ee22910e3ccd0b1a13d0701))

## [1.63.15](https://github.com/openwhyd/openwhyd/compare/v1.63.14...v1.63.15) (2025-05-29)


### Bug Fixes

* **api:** validate parameters of post api ([#821](https://github.com/openwhyd/openwhyd/issues/821)) ([e307fe7](https://github.com/openwhyd/openwhyd/commit/e307fe7301ab4376a8546deef179d215c0e7d928))

## [1.63.14](https://github.com/openwhyd/openwhyd/compare/v1.63.13...v1.63.14) (2025-05-26)


### Bug Fixes

* **deps:** bump cookie and express-openid-connect ([#804](https://github.com/openwhyd/openwhyd/issues/804)) ([4e95c4e](https://github.com/openwhyd/openwhyd/commit/4e95c4e4d52768431273e4e4ff67f0236353e206))

## [1.63.13](https://github.com/openwhyd/openwhyd/compare/v1.63.12...v1.63.13) (2025-05-26)


### Bug Fixes

* **deps:** bump axios from 1.7.9 to 1.9.0 ([#816](https://github.com/openwhyd/openwhyd/issues/816)) ([2a8017c](https://github.com/openwhyd/openwhyd/commit/2a8017c07a81a2263ac9d3527f1fc73f7fa8fa7d))

## [1.63.12](https://github.com/openwhyd/openwhyd/compare/v1.63.11...v1.63.12) (2025-05-24)


### Bug Fixes

* **api:** `BSONTypeError` errors on `GET /api/user/` calls ([#819](https://github.com/openwhyd/openwhyd/issues/819)) ([74e25de](https://github.com/openwhyd/openwhyd/commit/74e25dec6c185c3b83c39cb048994aa84d3493fb))

## [1.63.11](https://github.com/openwhyd/openwhyd/compare/v1.63.10...v1.63.11) (2025-05-21)


### Bug Fixes

* **tech-debt:** replace legacy `usernames` in-memory cache by DB queries ([#814](https://github.com/openwhyd/openwhyd/issues/814)) ([5c3ff18](https://github.com/openwhyd/openwhyd/commit/5c3ff18ab34efe335574746e48882ef32939dd5f)), closes [/github.com/openwhyd/openwhyd/pull/814/files#r2080047911](https://github.com//github.com/openwhyd/openwhyd/pull/814/files/issues/r2080047911) [/github.com/openwhyd/openwhyd/pull/814/files#r2080051308](https://github.com//github.com/openwhyd/openwhyd/pull/814/files/issues/r2080051308)

## [1.63.10](https://github.com/openwhyd/openwhyd/compare/v1.63.9...v1.63.10) (2025-05-08)


### Bug Fixes

* **ci:** use more recent ubuntu version ([#815](https://github.com/openwhyd/openwhyd/issues/815)) ([08e28ec](https://github.com/openwhyd/openwhyd/commit/08e28ec0c8c9c0d5ce47600b541aa6e2caa02b6d))

## [1.63.9](https://github.com/openwhyd/openwhyd/compare/v1.63.8...v1.63.9) (2025-04-06)


### Bug Fixes

* **notif:** uncaught error when unloving a post ([#811](https://github.com/openwhyd/openwhyd/issues/811)) ([8ae9c9b](https://github.com/openwhyd/openwhyd/commit/8ae9c9bf5bdb0679eef428c4762f53d76d3fc0bd))
* reactivate algolia tests + remove `/ip` endpoint ([#810](https://github.com/openwhyd/openwhyd/issues/810)) ([4b36f87](https://github.com/openwhyd/openwhyd/commit/4b36f87726aa48c81b93418a9391a129a98e20e5))

## [1.63.8](https://github.com/openwhyd/openwhyd/compare/v1.63.7...v1.63.8) (2025-03-28)


### Bug Fixes

* **api:** Revert "disable rate limit we until we find out why some requests don't respond" ([1b513f8](https://github.com/openwhyd/openwhyd/commit/1b513f870949844a793f6efca8d60d4fd7bda359))

## [1.63.7](https://github.com/openwhyd/openwhyd/compare/v1.63.6...v1.63.7) (2025-03-28)


### Bug Fixes

* **api:** fix call to resolve(), api-v2 requests can respond ([8796c17](https://github.com/openwhyd/openwhyd/commit/8796c17bd308d185b4b8fd9d150f11346cf3d2f1))

## [1.63.6](https://github.com/openwhyd/openwhyd/compare/v1.63.5...v1.63.6) (2025-03-28)


### Bug Fixes

* **api:** troubleshoot lack of response from `/api/v2/postTrack` ([2122980](https://github.com/openwhyd/openwhyd/commit/212298059499f6803a6a122c20c7f1098b8123f1))

## [1.63.5](https://github.com/openwhyd/openwhyd/compare/v1.63.4...v1.63.5) (2025-03-28)


### Bug Fixes

* **api:** disable rate limit we until we find out why some requests don't respond ([4020def](https://github.com/openwhyd/openwhyd/commit/4020def534a2b3199b07d8123fb9b80d8c45ee57))
* **ci:** skip 2nd algolia test that times out ([4a2f5a8](https://github.com/openwhyd/openwhyd/commit/4a2f5a806789f8a9f8ba8f6773bea108cc4be8ea))

## [1.63.4](https://github.com/openwhyd/openwhyd/compare/v1.63.3...v1.63.4) (2025-03-28)


### Bug Fixes

* **api:** make rate limiter work with HTTP proxy (cloudflare and/or nginx) ([#809](https://github.com/openwhyd/openwhyd/issues/809)) ([f6be99f](https://github.com/openwhyd/openwhyd/commit/f6be99fa11a565d1be8f15017df00088061161ec)), closes [/github.com/openwhyd/openwhyd/pull/808#issuecomment-2754369261](https://github.com//github.com/openwhyd/openwhyd/pull/808/issues/issuecomment-2754369261)
* **ci:** skip algolia test that times out ([62a3c51](https://github.com/openwhyd/openwhyd/commit/62a3c51633abaf281484690e759df25a80347d9d))

## [1.63.3](https://github.com/openwhyd/openwhyd/compare/v1.63.2...v1.63.3) (2025-03-26)


### Bug Fixes

* **api-v2:** add rate limiter + add tests + refactor ([#808](https://github.com/openwhyd/openwhyd/issues/808)) ([349b73b](https://github.com/openwhyd/openwhyd/commit/349b73b90586dc6be7206a5b6af46e3b245757db)), closes [/github.com/openwhyd/openwhyd/pull/808#discussion_r2012476188](https://github.com//github.com/openwhyd/openwhyd/pull/808/issues/discussion_r2012476188)

## [1.63.2](https://github.com/openwhyd/openwhyd/compare/v1.63.1...v1.63.2) (2025-03-24)


### Bug Fixes

* **api:** `/api/v2/postTrack` to return a valid URL ([d8f77c7](https://github.com/openwhyd/openwhyd/commit/d8f77c71b6b7d319fd27825e9805f7bb20d8763c))

## [1.63.1](https://github.com/openwhyd/openwhyd/compare/v1.63.0...v1.63.1) (2025-03-24)


### Bug Fixes

* **api:** `InvalidTokenError: Unexpected "aud" value` ([#807](https://github.com/openwhyd/openwhyd/issues/807)) ([b0bda6c](https://github.com/openwhyd/openwhyd/commit/b0bda6c940df337760c7358a5ab5baeaf040568a)), closes [#806](https://github.com/openwhyd/openwhyd/issues/806)

# [1.63.0](https://github.com/openwhyd/openwhyd/compare/v1.62.1...v1.63.0) (2025-03-24)


### Features

* **api:** `POST /api/v2/postTrack` endpoint to post YouTube tracks ([#806](https://github.com/openwhyd/openwhyd/issues/806)) ([177caff](https://github.com/openwhyd/openwhyd/commit/177caffa5683faae09b8cf608d5deec351daee3d))

## [1.62.1](https://github.com/openwhyd/openwhyd/compare/v1.62.0...v1.62.1) (2025-03-21)


### Bug Fixes

* **auth:** fix `audience` to match existing Auth0 API ([4c573da](https://github.com/openwhyd/openwhyd/commit/4c573da24f5729879d4431b4336b2381063fc813))

# [1.62.0](https://github.com/openwhyd/openwhyd/compare/v1.61.5...v1.62.0) (2025-03-21)


### Features

* **api:** introduce a first API endpoint that supports access tokens ([#803](https://github.com/openwhyd/openwhyd/issues/803)) ([5989ea7](https://github.com/openwhyd/openwhyd/commit/5989ea7afb17c8a4ea2b6a534e084d93285acbc1)), closes [#55](https://github.com/openwhyd/openwhyd/issues/55)

## [1.61.5](https://github.com/openwhyd/openwhyd/compare/v1.61.4...v1.61.5) (2025-02-01)


### Bug Fixes

* **logs:** reduce noise from users that login via the /register endpoint ([fab0d1c](https://github.com/openwhyd/openwhyd/commit/fab0d1ca9afa75920a566f9257c0d74e47467ff0))

## [1.61.4](https://github.com/openwhyd/openwhyd/compare/v1.61.3...v1.61.4) (2025-02-01)


### Bug Fixes

* **auth:** always check if logged in user needs to register/signup in our db ([#799](https://github.com/openwhyd/openwhyd/issues/799)) ([81ae75c](https://github.com/openwhyd/openwhyd/commit/81ae75ca28a14e0f7875858544e00ba5050ebb52))

## [1.61.3](https://github.com/openwhyd/openwhyd/compare/v1.61.2...v1.61.3) (2025-01-26)


### Bug Fixes

* **auth:** redirect to home directly, if user signing up from auth0 already exists ([67e39b5](https://github.com/openwhyd/openwhyd/commit/67e39b56ced420963d886952749a661139f22727))

## [1.61.2](https://github.com/openwhyd/openwhyd/compare/v1.61.1...v1.61.2) (2025-01-26)


### Bug Fixes

* **auth:** log handle on account signup and deletion ([7514065](https://github.com/openwhyd/openwhyd/commit/7514065e463ad12dc3f1b98100afcc267c95cd02))

## [1.61.1](https://github.com/openwhyd/openwhyd/compare/v1.61.0...v1.61.1) (2025-01-11)


### Bug Fixes

* **users:** logout after user deletion ([#797](https://github.com/openwhyd/openwhyd/issues/797)) ([eb54c64](https://github.com/openwhyd/openwhyd/commit/eb54c64a6738dbfddd2b0cd656c59037793bef35))

# [1.61.0](https://github.com/openwhyd/openwhyd/compare/v1.60.4...v1.61.0) (2025-01-11)


### Features

* prevent search engines from indexing user profiles ([#796](https://github.com/openwhyd/openwhyd/issues/796)) ([2db7638](https://github.com/openwhyd/openwhyd/commit/2db763851ba07f2bfc870c468861a36daf9cca6e)), closes [#795](https://github.com/openwhyd/openwhyd/issues/795)

## [1.60.4](https://github.com/openwhyd/openwhyd/compare/v1.60.3...v1.60.4) (2025-01-05)


### Bug Fixes

* don't allow user renaming in case of validation error ([#794](https://github.com/openwhyd/openwhyd/issues/794)) ([8843fb5](https://github.com/openwhyd/openwhyd/commit/8843fb5a8ac50acb40bb8a8c1bf738b560fa4e36))

## [1.60.3](https://github.com/openwhyd/openwhyd/compare/v1.60.2...v1.60.3) (2024-12-15)


### Bug Fixes

* **deps:** `$ npm audit fix` ([#793](https://github.com/openwhyd/openwhyd/issues/793)) ([502fac0](https://github.com/openwhyd/openwhyd/commit/502fac05a23bfa75eb4e1de88178af934b39a6f0))

## [1.60.2](https://github.com/openwhyd/openwhyd/compare/v1.60.1...v1.60.2) (2024-12-15)


### Bug Fixes

* **deps:** update auth deps + some devDeps ([#792](https://github.com/openwhyd/openwhyd/issues/792)) ([ab02b25](https://github.com/openwhyd/openwhyd/commit/ab02b250366efd2fab16a32437004573e0bd57af))

## [1.60.1](https://github.com/openwhyd/openwhyd/compare/v1.60.0...v1.60.1) (2024-12-14)


### Bug Fixes

* **deps:** bump path-to-regexp and express ([#789](https://github.com/openwhyd/openwhyd/issues/789)) ([719a744](https://github.com/openwhyd/openwhyd/commit/719a744e21832e69800c27d8015a5a1808da3bda))

# [1.60.0](https://github.com/openwhyd/openwhyd/compare/v1.59.22...v1.60.0) (2024-12-08)


### Features

* **mobile:** promote mobile track finder on homepage ([#791](https://github.com/openwhyd/openwhyd/issues/791)) ([687a0b6](https://github.com/openwhyd/openwhyd/commit/687a0b6ee04c9d758b7f026cb039b65fec0cecfb))

## [1.59.22](https://github.com/openwhyd/openwhyd/compare/v1.59.21...v1.59.22) (2024-12-07)


### Bug Fixes

* **soundcloud:** playback and lookup of soundcloud URLs ([#790](https://github.com/openwhyd/openwhyd/issues/790)) ([ad160a4](https://github.com/openwhyd/openwhyd/commit/ad160a41ddfd7a5e6b28d0e98dff5c81338727e6))

## [1.59.21](https://github.com/openwhyd/openwhyd/compare/v1.59.20...v1.59.21) (2024-11-16)


### Bug Fixes

* **bookmarklet:** safer way to trim whitespace from titles  ([#787](https://github.com/openwhyd/openwhyd/issues/787)) ([12f340a](https://github.com/openwhyd/openwhyd/commit/12f340aaa143112fa05af64eb20ceb30cf70b92f))

## [1.59.20](https://github.com/openwhyd/openwhyd/compare/v1.59.19...v1.59.20) (2024-08-18)


### Bug Fixes

* **chrome-extension:** migrate to manifest version 3 ([#774](https://github.com/openwhyd/openwhyd/issues/774)) ([3a62bfb](https://github.com/openwhyd/openwhyd/commit/3a62bfbaac0e0772b6772db6f18ed477bd993199))

## [1.59.19](https://github.com/openwhyd/openwhyd/compare/v1.59.18...v1.59.19) (2024-08-03)


### Bug Fixes

* **ci:** `docker-compose: command not found` ([#773](https://github.com/openwhyd/openwhyd/issues/773)) ([5844ab0](https://github.com/openwhyd/openwhyd/commit/5844ab0d8064628dd7bd50e083d52468fcf99e10))

## [1.59.18](https://github.com/openwhyd/openwhyd/compare/v1.59.17...v1.59.18) (2024-08-03)


### Bug Fixes

* **deps:** bump follow-redirects from 1.15.4 to 1.15.6 ([#766](https://github.com/openwhyd/openwhyd/issues/766)) ([f54b7b1](https://github.com/openwhyd/openwhyd/commit/f54b7b1d76a6a2ec05ceb9859fe9d5664c67e2db))

## [1.59.17](https://github.com/openwhyd/openwhyd/compare/v1.59.16...v1.59.17) (2024-06-26)


### Bug Fixes

* **deps-dev:** bump braces from 3.0.2 to 3.0.3 ([#771](https://github.com/openwhyd/openwhyd/issues/771)) ([4ad2203](https://github.com/openwhyd/openwhyd/commit/4ad2203aa5662a5d8a4ebff58dbf9251b59d45f8))

## [1.59.16](https://github.com/openwhyd/openwhyd/compare/v1.59.15...v1.59.16) (2024-03-09)


### Bug Fixes

* **auth:** revert previous commit ([0b1a7a2](https://github.com/openwhyd/openwhyd/commit/0b1a7a26d4e3235733c4d44dd553752bc9609941))

## [1.59.15](https://github.com/openwhyd/openwhyd/compare/v1.59.14...v1.59.15) (2024-03-09)


### Bug Fixes

* **auth:** try to refresh auth0 session silently, without having to re-login everyday ([c8fb684](https://github.com/openwhyd/openwhyd/commit/c8fb684f7e0c8628fc2adf1889ad48ba4c8b63c3)), closes [#705](https://github.com/openwhyd/openwhyd/issues/705)

## [1.59.14](https://github.com/openwhyd/openwhyd/compare/v1.59.13...v1.59.14) (2024-02-04)


### Bug Fixes

* admin routes should redirect to auth0 login page ([91dbb68](https://github.com/openwhyd/openwhyd/commit/91dbb68b99a062805a8ee49fd47da2659d03c569))

## [1.59.13](https://github.com/openwhyd/openwhyd/compare/v1.59.12...v1.59.13) (2024-01-11)


### Bug Fixes

* **deps:** bump follow-redirects from 1.15.3 to 1.15.4 ([#760](https://github.com/openwhyd/openwhyd/issues/760)) ([c022137](https://github.com/openwhyd/openwhyd/commit/c0221372f3993bdeacdbc55ff8b3b58d3e58ea9c))

## [1.59.12](https://github.com/openwhyd/openwhyd/compare/v1.59.11...v1.59.12) (2024-01-04)


### Bug Fixes

* **import-posts:** `MongoServerError: Authentication failed.` ([50fa788](https://github.com/openwhyd/openwhyd/commit/50fa78879d953d1e7fa305cb1f85598fafc449ed))
* **import-posts:** use WHYD_URL_PREFIX env var ([caa0816](https://github.com/openwhyd/openwhyd/commit/caa08163a389e4fe33be575f0064598e89f2400a))

## [1.59.11](https://github.com/openwhyd/openwhyd/compare/v1.59.10...v1.59.11) (2023-12-29)


### Bug Fixes

* **auth:** delete `request.session` if user is not logged in from auth0 ([25e5e65](https://github.com/openwhyd/openwhyd/commit/25e5e6516d4171d3154b33df6cdb6105abf1f864))

## [1.59.10](https://github.com/openwhyd/openwhyd/compare/v1.59.9...v1.59.10) (2023-12-29)


### Bug Fixes

* **auth:** make sure that legacy auth/session middleware is not initialize alongside Auth0 ([1ada22f](https://github.com/openwhyd/openwhyd/commit/1ada22f859dd179457460c7c8462006d750eeced)), closes [#756](https://github.com/openwhyd/openwhyd/issues/756)

## [1.59.9](https://github.com/openwhyd/openwhyd/compare/v1.59.8...v1.59.9) (2023-12-29)


### Bug Fixes

* **auth:** make sure that `request.session` is defined, even if auth0 is used ([79523d9](https://github.com/openwhyd/openwhyd/commit/79523d988a6b9b5e32431ef056ddfe50cd15f848)), closes [#756](https://github.com/openwhyd/openwhyd/issues/756)
* **auth:** make sure that `whydUid` is cleared after logout from Auth0 ([9ab6305](https://github.com/openwhyd/openwhyd/commit/9ab6305a6594870e7815864acb56aa7da04b5a4d)), closes [#756](https://github.com/openwhyd/openwhyd/issues/756)

## [1.59.8](https://github.com/openwhyd/openwhyd/compare/v1.59.7...v1.59.8) (2023-12-29)


### Bug Fixes

* **auth:** logout local session after auth0 logout ([6e7299d](https://github.com/openwhyd/openwhyd/commit/6e7299ddeb2019df701fa0b013d194135e1e75fc)), closes [#756](https://github.com/openwhyd/openwhyd/issues/756)
* comments ([21c0f23](https://github.com/openwhyd/openwhyd/commit/21c0f2383b2fe210eb0bed0429ed0f4b3da02146))
* **env:** no need to expose local db, assuming that users were uploaded to auth0 "dev" tenant's db ([31b1019](https://github.com/openwhyd/openwhyd/commit/31b10190d3fabfeace156c1e06f41f6330b28d8f))
* **env:** typo on required env var: `AUTH0_CLIENT_SECRET` ([eb54506](https://github.com/openwhyd/openwhyd/commit/eb5450678017fc0df462d416415cac8075a495ca))
* **makefile:** `docker-seed` to start services ([998607b](https://github.com/openwhyd/openwhyd/commit/998607b674143013af9959455e73d8b041de1fe7))
* **makefile:** `make dev` to start openwhyd against "dev" auth0 tenant ([4a1ae82](https://github.com/openwhyd/openwhyd/commit/4a1ae82ef5345f54856dee80207bd98f507ed8e5))

## [1.59.7](https://github.com/openwhyd/openwhyd/compare/v1.59.6...v1.59.7) (2023-12-29)


### Bug Fixes

* **auth:** `state missing from the response` ([d7bd77a](https://github.com/openwhyd/openwhyd/commit/d7bd77a0d6d1d7fac1f80e175fa99ea29bf75776)), closes [/github.com/auth0/express-openid-connect/issues/145#issuecomment-744188994](https://github.com//github.com/auth0/express-openid-connect/issues/145/issues/issuecomment-744188994) [/github.com/auth0/express-openid-connect/blob/8ade66846a1f041591e267d2296b02df2604f1f4/test/appSession.tests.js#L310](https://github.com//github.com/auth0/express-openid-connect/blob/8ade66846a1f041591e267d2296b02df2604f1f4/test/appSession.tests.js/issues/L310)

## [1.59.6](https://github.com/openwhyd/openwhyd/compare/v1.59.5...v1.59.6) (2023-12-27)


### Bug Fixes

* **pm2:** try to make pm2 reload/update all env vars ([b6662ee](https://github.com/openwhyd/openwhyd/commit/b6662ee11752d1060df93cbfaa577d0d6d16cccb))

## [1.59.5](https://github.com/openwhyd/openwhyd/compare/v1.59.4...v1.59.5) (2023-12-27)


### Bug Fixes

* **pm2:** `Using --env [env] without passing the ecosystem.config.js does not work` ([6882aae](https://github.com/openwhyd/openwhyd/commit/6882aae2b83e7f47f9b408649d26dab49b683014))

## [1.59.4](https://github.com/openwhyd/openwhyd/compare/v1.59.3...v1.59.4) (2023-12-27)


### Bug Fixes

* **auth:** add scripts to import users to auth0 ([#755](https://github.com/openwhyd/openwhyd/issues/755)) ([d55d0f3](https://github.com/openwhyd/openwhyd/commit/d55d0f3b4f11c0a83f07d2e1a2b22ac0eb02a353)), closes [#705](https://github.com/openwhyd/openwhyd/issues/705) [#669](https://github.com/openwhyd/openwhyd/issues/669)

## [1.59.3](https://github.com/openwhyd/openwhyd/compare/v1.59.2...v1.59.3) (2023-12-23)


### Bug Fixes

* upgrade to node 20 ([#754](https://github.com/openwhyd/openwhyd/issues/754)) ([6eadd53](https://github.com/openwhyd/openwhyd/commit/6eadd53b2ab993661ed82cb2d92509660469db52))

## [1.59.2](https://github.com/openwhyd/openwhyd/compare/v1.59.1...v1.59.2) (2023-12-23)


### Bug Fixes

* basic eslint warnings ([2a38d20](https://github.com/openwhyd/openwhyd/commit/2a38d20b32b83c8da25ac67d673b5153a37e1b42))

## [1.59.1](https://github.com/openwhyd/openwhyd/compare/v1.59.0...v1.59.1) (2023-12-23)


### Bug Fixes

* **deps-dev:** bump cypress from 13.2.0 to 13.3.0 ([#742](https://github.com/openwhyd/openwhyd/issues/742)) ([684c0f0](https://github.com/openwhyd/openwhyd/commit/684c0f00f5b307612be31e78b2ad64b2b9f28d9a))

# [1.59.0](https://github.com/openwhyd/openwhyd/compare/v1.58.3...v1.59.0) (2023-11-04)


### Features

* **spam:** don't link to user's homepage ([5d0bcde](https://github.com/openwhyd/openwhyd/commit/5d0bcdeb4d171fb47845bb0c6ea8286d22da7355))

## [1.58.3](https://github.com/openwhyd/openwhyd/compare/v1.58.2...v1.58.3) (2023-11-04)


### Bug Fixes

* **digest:** end worker process in case of error ([#752](https://github.com/openwhyd/openwhyd/issues/752)) ([39ad323](https://github.com/openwhyd/openwhyd/commit/39ad323d29f12c32e6d0b5e337ff243c8e9d24d9)), closes [#634](https://github.com/openwhyd/openwhyd/issues/634)

## [1.58.2](https://github.com/openwhyd/openwhyd/compare/v1.58.1...v1.58.2) (2023-10-29)


### Bug Fixes

* **message:** invite users to prepare for account migration ([535412c](https://github.com/openwhyd/openwhyd/commit/535412ccb84f6e30dd1235eaddf030ecf617531a))
* **security:** use `rel=noopener` on links ([fe64ced](https://github.com/openwhyd/openwhyd/commit/fe64ced12140bf27d87eba0257bf46b86fc2a057))
* **security:** use `rel=noopener` on remaining link ([2278818](https://github.com/openwhyd/openwhyd/commit/22788185ed8f12d243807ab72222723ca960a996))

## [1.58.1](https://github.com/openwhyd/openwhyd/compare/v1.58.0...v1.58.1) (2023-10-29)


### Bug Fixes

* **deps:** remove argon2 ([a13479b](https://github.com/openwhyd/openwhyd/commit/a13479bca4a049816bc81de0978a97c3451ab3ec)), closes [#751](https://github.com/openwhyd/openwhyd/issues/751)
* **tests:** update approval test snapshots ([6c251bc](https://github.com/openwhyd/openwhyd/commit/6c251bc64d695e010d3804113cbe35dbae8fc459))

# [1.58.0](https://github.com/openwhyd/openwhyd/compare/v1.57.1...v1.58.0) (2023-10-15)


### Features

* **auth:** allow Auth0 as authentication server, after bulk user import ([#705](https://github.com/openwhyd/openwhyd/issues/705)) ([a65723f](https://github.com/openwhyd/openwhyd/commit/a65723ffd7fe954d045df7753cbcca9799ab8df8)), closes [#593](https://github.com/openwhyd/openwhyd/issues/593) [#669](https://github.com/openwhyd/openwhyd/issues/669) [#658](https://github.com/openwhyd/openwhyd/issues/658)

## [1.57.1](https://github.com/openwhyd/openwhyd/compare/v1.57.0...v1.57.1) (2023-10-11)


### Bug Fixes

* **logs:** reduce error logs from fieldSetters ([#747](https://github.com/openwhyd/openwhyd/issues/747)) ([68b3ab3](https://github.com/openwhyd/openwhyd/commit/68b3ab3bb4d3b160ee1cd62f4844c1456c0cf0a5))

# [1.57.0](https://github.com/openwhyd/openwhyd/compare/v1.56.8...v1.57.0) (2023-09-21)


### Features

* **hot-tracks:** 🧹 remove computation of relative ranking trends ([#737](https://github.com/openwhyd/openwhyd/issues/737)) ([1eed523](https://github.com/openwhyd/openwhyd/commit/1eed523396ff5dc13d9e1f3c1023b59827ba3fc0))

## [1.56.8](https://github.com/openwhyd/openwhyd/compare/v1.56.7...v1.56.8) (2023-09-20)


### Bug Fixes

* **deps:** Update most dependencies ([#736](https://github.com/openwhyd/openwhyd/issues/736)) ([f64f90c](https://github.com/openwhyd/openwhyd/commit/f64f90c6e17229c13adb3f4f0abe40c8ecdaa92d))

## [1.56.7](https://github.com/openwhyd/openwhyd/compare/v1.56.6...v1.56.7) (2023-09-11)


### Bug Fixes

* **deps:** update most dependencies ([#729](https://github.com/openwhyd/openwhyd/issues/729)) ([f471732](https://github.com/openwhyd/openwhyd/commit/f4717321ad09b2098b132956d08bb068fe3d2453))

## [1.56.6](https://github.com/openwhyd/openwhyd/compare/v1.56.5...v1.56.6) (2023-09-08)


### Bug Fixes

* **tests:** `Cannot find module 'mocha'` in production docker container ([8c48cf1](https://github.com/openwhyd/openwhyd/commit/8c48cf16d212efdaeb2cbde1d589030313fb703e))
* **tests:** update approval snapshots ([73178bd](https://github.com/openwhyd/openwhyd/commit/73178bd8de9d519ef3606c0a363fbaaff5c49e6b))

## [1.56.5](https://github.com/openwhyd/openwhyd/compare/v1.56.4...v1.56.5) (2023-09-08)


### Bug Fixes

* **tests:** add tracks for hot-tracks visual e2e test ([433b9ca](https://github.com/openwhyd/openwhyd/commit/433b9cae9eb749a601a5ba5bd6f9679346f4dbfb))

## [1.56.4](https://github.com/openwhyd/openwhyd/compare/v1.56.3...v1.56.4) (2023-09-08)


### Bug Fixes

* **hot-tracks:** for each track, feature the user who posted it early ([3a7a718](https://github.com/openwhyd/openwhyd/commit/3a7a718cbf5dd8a7d9ab94cd3bae8a447f59e8a1)), closes [#718](https://github.com/openwhyd/openwhyd/issues/718)
* **tests:** extract api tests for hot tracks ([f8e4f74](https://github.com/openwhyd/openwhyd/commit/f8e4f746cde0af969dba6dfa8ec868feccfd6be9))

## [1.56.3](https://github.com/openwhyd/openwhyd/compare/v1.56.2...v1.56.3) (2023-09-08)


### Bug Fixes

* **tests:** clean up hot-tracks approval tests ([12e9385](https://github.com/openwhyd/openwhyd/commit/12e9385dfa4e0deeb7953ad39f7cf099499daaba))

## [1.56.2](https://github.com/openwhyd/openwhyd/compare/v1.56.1...v1.56.2) (2023-09-07)


### Bug Fixes

* **hot-tracks:** add missing image ([62e63a8](https://github.com/openwhyd/openwhyd/commit/62e63a8aea19a2804a36b50b083eccb43136f32d)), closes [#718](https://github.com/openwhyd/openwhyd/issues/718)
* **hot-tracks:** add missing user info ([952d0f4](https://github.com/openwhyd/openwhyd/commit/952d0f42510d6b45e95c43bc980ef379c58df5fa)), closes [#718](https://github.com/openwhyd/openwhyd/issues/718)

## [1.56.1](https://github.com/openwhyd/openwhyd/compare/v1.56.0...v1.56.1) (2023-09-07)


### Bug Fixes

* **hot-tracks:** improves scoring, using mongo aggregate ([e6a966d](https://github.com/openwhyd/openwhyd/commit/e6a966d6db16e49ad63fb38aedf42dd3b2068733)), closes [#718](https://github.com/openwhyd/openwhyd/issues/718)

# [1.56.0](https://github.com/openwhyd/openwhyd/compare/v1.55.65...v1.56.0) (2023-09-07)


### Features

* **hot-tracks:** try list of recent posts sorted by number of reposts ([#720](https://github.com/openwhyd/openwhyd/issues/720)) ([7b870c3](https://github.com/openwhyd/openwhyd/commit/7b870c38aa1a0ae796b2c3210d326922cf118f12)), closes [#718](https://github.com/openwhyd/openwhyd/issues/718)

## [1.55.65](https://github.com/openwhyd/openwhyd/compare/v1.55.64...v1.55.65) (2023-09-07)


### Bug Fixes

* **hot-tracks:** don't include invalid SoundCloud `eId` ([#719](https://github.com/openwhyd/openwhyd/issues/719)) ([9b25e3d](https://github.com/openwhyd/openwhyd/commit/9b25e3d152cbb539c724bdc30d12e721097e4c97)), closes [#718](https://github.com/openwhyd/openwhyd/issues/718) [#614](https://github.com/openwhyd/openwhyd/issues/614) [#03](https://github.com/openwhyd/openwhyd/issues/03) [#614](https://github.com/openwhyd/openwhyd/issues/614)

## [1.55.64](https://github.com/openwhyd/openwhyd/compare/v1.55.63...v1.55.64) (2023-09-07)


### Bug Fixes

* **scripts:** 🧹 remove old git script ([4147195](https://github.com/openwhyd/openwhyd/commit/414719582a8010da223f335d3d96b98495c814c4))
* **scripts:** 🧹 remove useless .editorconfig file ([981c697](https://github.com/openwhyd/openwhyd/commit/981c6971ad71bef0ada4a806a0c5562815f775e4))
* **scripts:** add script to run mongo shell in prod ([14eb574](https://github.com/openwhyd/openwhyd/commit/14eb574484b3d64f606fbd155ad231afa0facd47))
* **scripts:** move db backup script ([0ba10a3](https://github.com/openwhyd/openwhyd/commit/0ba10a3746b241496f2ec97199dd2431018ea020))

## [1.55.63](https://github.com/openwhyd/openwhyd/compare/v1.55.62...v1.55.63) (2023-09-05)


### Bug Fixes

* **tests:** reduce chance of `The play() request was interrupted by a call to pause` error ([eb996ac](https://github.com/openwhyd/openwhyd/commit/eb996ac05e7a50739536d12bd45098e74b9ddc8d)), closes [#714](https://github.com/openwhyd/openwhyd/issues/714)
* **typing:** TS errors in api/user.js ([6f1b03b](https://github.com/openwhyd/openwhyd/commit/6f1b03bb92f88cd3e096c4b36958eb59acda028a))
* **typing:** TS errors in register.js and models/user.js ([a0b92fa](https://github.com/openwhyd/openwhyd/commit/a0b92fa481f8e4f28f8b473ac0599d0b5df96a7a))

## [1.55.62](https://github.com/openwhyd/openwhyd/compare/v1.55.61...v1.55.62) (2023-09-05)


### Bug Fixes

* **auth:** we need to create a /signup route for Auth0 => make it work with the legacy signup page ([d3e2592](https://github.com/openwhyd/openwhyd/commit/d3e2592beb1cf14372024e92a4ba6e7f1f7f2199)), closes [#705](https://github.com/openwhyd/openwhyd/issues/705)

## [1.55.61](https://github.com/openwhyd/openwhyd/compare/v1.55.60...v1.55.61) (2023-09-02)


### Bug Fixes

* linter issues caused by previous commit ([17998a1](https://github.com/openwhyd/openwhyd/commit/17998a178a661c688781f91b40e5a558a270fa49))
* **perf:** disable history on home page ([52536d3](https://github.com/openwhyd/openwhyd/commit/52536d3a0c5377bd0208a51b5408f8c412c0b3c4)), closes [#681](https://github.com/openwhyd/openwhyd/issues/681) [#682](https://github.com/openwhyd/openwhyd/issues/682) [#630](https://github.com/openwhyd/openwhyd/issues/630) [#634](https://github.com/openwhyd/openwhyd/issues/634)

## [1.55.60](https://github.com/openwhyd/openwhyd/compare/v1.55.59...v1.55.60) (2023-08-31)


### Bug Fixes

* **domain:** remove links to whyd.com => fix unsubscribe link ([67ef678](https://github.com/openwhyd/openwhyd/commit/67ef678c00254f2cae4bb33ddd8bc5060e202908))

## [1.55.59](https://github.com/openwhyd/openwhyd/compare/v1.55.58...v1.55.59) (2023-08-31)


### Bug Fixes

* **error-handling:** don't callback twice upon rejection ([#704](https://github.com/openwhyd/openwhyd/issues/704)) ([0a13423](https://github.com/openwhyd/openwhyd/commit/0a134235b93b408979829e7b3e323f9e536bc135)), closes [#703](https://github.com/openwhyd/openwhyd/issues/703)

## [1.55.58](https://github.com/openwhyd/openwhyd/compare/v1.55.57...v1.55.58) (2023-08-31)


### Bug Fixes

* **search:** fix algolia error handling logic ([#703](https://github.com/openwhyd/openwhyd/issues/703)) ([14893ff](https://github.com/openwhyd/openwhyd/commit/14893ff6f7971aa6cc1cd7ed911d01fd72b16118))

## [1.55.57](https://github.com/openwhyd/openwhyd/compare/v1.55.56...v1.55.57) (2023-08-31)


### Bug Fixes

* **build:** prevent `This is not the tsc command you are looking for` ([71cefd4](https://github.com/openwhyd/openwhyd/commit/71cefd48674011b0c2503e7eb4e7715e4ecb0451)), closes [#563](https://github.com/openwhyd/openwhyd/issues/563) [#662](https://github.com/openwhyd/openwhyd/issues/662) [#702](https://github.com/openwhyd/openwhyd/issues/702)
* **docker:** `This is not the tsc command you are looking for` ([80a542d](https://github.com/openwhyd/openwhyd/commit/80a542df40bd0e12a3774bc1061631d385482029)), closes [#702](https://github.com/openwhyd/openwhyd/issues/702)

## [1.55.56](https://github.com/openwhyd/openwhyd/compare/v1.55.55...v1.55.56) (2023-08-31)


### Bug Fixes

* **deps-dev:** bump typescript from 5.1.6 to 5.2.2 ([#700](https://github.com/openwhyd/openwhyd/issues/700)) ([b783050](https://github.com/openwhyd/openwhyd/commit/b7830507b1631cb6853dfc0740f07cb8c2cccec2))

## [1.55.55](https://github.com/openwhyd/openwhyd/compare/v1.55.54...v1.55.55) (2023-08-31)


### Bug Fixes

* bump version to release ([eb8a90f](https://github.com/openwhyd/openwhyd/commit/eb8a90f8ee1eb0166deb864f802621d68e3518eb))

## [1.55.54](https://github.com/openwhyd/openwhyd/compare/v1.55.53...v1.55.54) (2023-08-31)


### Bug Fixes

* **formatting:** `$ make lint` ([fb2eb8a](https://github.com/openwhyd/openwhyd/commit/fb2eb8aec6dc7ee4a39d6c7da6bc16b91546b86b))

## [1.55.53](https://github.com/openwhyd/openwhyd/compare/v1.55.52...v1.55.53) (2023-08-31)


### Bug Fixes

* **ci:** update `CHANGELOG.md` on release ([#692](https://github.com/openwhyd/openwhyd/issues/692)) ([61e284e](https://github.com/openwhyd/openwhyd/commit/61e284e0b5b8c2b4724ac343c4dc231e74649251))

## [1.44.55](https://github.com/openwhyd/openwhyd/compare/v1.44.54...v1.44.55) (2021-10-09)


### Bug Fixes

* **tests:** Let the server run after approval tests ([#488](https://github.com/openwhyd/openwhyd/issues/488)) ([3e59421](https://github.com/openwhyd/openwhyd/commit/3e59421d145fc6080c5cd0edb7cee9aee3beffb5))

## [1.44.54](https://github.com/openwhyd/openwhyd/compare/v1.44.53...v1.44.54) (2021-10-09)


### Bug Fixes

* **tests:** Log errors when running approval tests ([#485](https://github.com/openwhyd/openwhyd/issues/485)) ([da43c20](https://github.com/openwhyd/openwhyd/commit/da43c20f6205c1de303f64014cfdf25f768ab994))

## [1.44.53](https://github.com/openwhyd/openwhyd/compare/v1.44.52...v1.44.53) (2021-10-09)


### Bug Fixes

* **tests:** Make approval tests run faster ([#484](https://github.com/openwhyd/openwhyd/issues/484)) ([3a79399](https://github.com/openwhyd/openwhyd/commit/3a79399f9ef490aa34906a2b3f47d6a9f404fb0a))

## [1.44.52](https://github.com/openwhyd/openwhyd/compare/v1.44.51...v1.44.52) (2021-10-09)


### Bug Fixes

* **tests:** Get rid of Mongo's DeprecationWarning on approval tests ([143f0f5](https://github.com/openwhyd/openwhyd/commit/143f0f5369a7c478c71a750c0e210aa328969f00))

## [1.44.51](https://github.com/openwhyd/openwhyd/compare/v1.44.50...v1.44.51) (2021-09-03)


### Bug Fixes

* **tests:** Login to support email addresses with a `+` character ([0f8c2c4](https://github.com/openwhyd/openwhyd/commit/0f8c2c4e55e5a73610c767065d8ab92e36f7fe30))

## [1.44.50](https://github.com/openwhyd/openwhyd/compare/v1.44.49...v1.44.50) (2021-09-03)


### Bug Fixes

* **tests:** Allow importing test data for any db collection ([884def1](https://github.com/openwhyd/openwhyd/commit/884def1c71c748655bc294e2b3084c627973a848))

## [1.44.49](https://github.com/openwhyd/openwhyd/compare/v1.44.48...v1.44.49) (2021-08-19)


### Bug Fixes

* **tests:** loginAs() and signupAs() inform if cookie was set ([#473](https://github.com/openwhyd/openwhyd/issues/473)) ([d82f699](https://github.com/openwhyd/openwhyd/commit/d82f699315f233ca93700f6109e5c5af01b9f404))

## [1.44.48](https://github.com/openwhyd/openwhyd/compare/v1.44.47...v1.44.48) (2021-08-19)


### Bug Fixes

* **tests:** add db-helpers ([86d16f7](https://github.com/openwhyd/openwhyd/commit/86d16f710a3808eb7192f1b7c3a5d3734696682d))

## [1.44.47](https://github.com/openwhyd/openwhyd/compare/v1.44.46...v1.44.47) (2021-08-19)


### Bug Fixes

* **tests:** allow to override mongodb URL in import-from-prod.js ([1da673f](https://github.com/openwhyd/openwhyd/commit/1da673fff523f1f4e4cbb07b8b11136bf5cb134a))

## [1.44.46](https://github.com/openwhyd/openwhyd/compare/v1.44.45...v1.44.46) (2021-08-19)


### Bug Fixes

* **tests:** also disable Datadog on local testing env, to match docker env ([a0c5684](https://github.com/openwhyd/openwhyd/commit/a0c5684995ac45aa40c7342ae991d33c0fac57cd))

## [1.44.45](https://github.com/openwhyd/openwhyd/compare/v1.44.44...v1.44.45) (2021-08-19)


### Bug Fixes

* **tests:** extract getRaw() helper, to allow fetching HTML pages ([#468](https://github.com/openwhyd/openwhyd/issues/468)) ([bd730d9](https://github.com/openwhyd/openwhyd/commit/bd730d959c7f3b990f65a9fdecb95a2ebc67d10b))

## [1.44.44](https://github.com/openwhyd/openwhyd/compare/v1.44.43...v1.44.44) (2021-08-19)


### Bug Fixes

* **tests:** lookup external tracks ([#469](https://github.com/openwhyd/openwhyd/issues/469)) ([5169df2](https://github.com/openwhyd/openwhyd/commit/5169df2bc03419286f6413a4176ad1dc1dd60c75)), closes [#465](https://github.com/openwhyd/openwhyd/issues/465)

## [1.44.43](https://github.com/openwhyd/openwhyd/compare/v1.44.42...v1.44.43) (2021-05-28)


### Bug Fixes

* **ui:** Improve text of search bar placeholder for new users ([#461](https://github.com/openwhyd/openwhyd/issues/461)) ([c8be106](https://github.com/openwhyd/openwhyd/commit/c8be106017fd7a355ec2c85c99acff37ec70172d))

## [1.44.42](https://github.com/openwhyd/openwhyd/compare/v1.44.41...v1.44.42) (2021-05-28)


### Bug Fixes

* **#458:** Support Deezer track URLs with a locale/country prefix ([#460](https://github.com/openwhyd/openwhyd/issues/460)) ([f8f94a6](https://github.com/openwhyd/openwhyd/commit/f8f94a67bc21111065f357bd8d7518683600cec6)), closes [#458](https://github.com/openwhyd/openwhyd/issues/458)

## [1.44.41](https://github.com/openwhyd/openwhyd/compare/v1.44.40...v1.44.41) (2021-05-15)


### Bug Fixes

* **docker:** Apply OWASP recommendations ([#455](https://github.com/openwhyd/openwhyd/issues/455)) ([5507606](https://github.com/openwhyd/openwhyd/commit/5507606b4cb4116a8b26cfbbe9381a858204821b))

## [1.44.40](https://github.com/openwhyd/openwhyd/compare/v1.44.39...v1.44.40) (2021-05-14)


### Bug Fixes

* **fb:** Update Facebook login SDK ([#454](https://github.com/openwhyd/openwhyd/issues/454)) ([987ce00](https://github.com/openwhyd/openwhyd/commit/987ce00063c7e36268a88211908b3168e285c526)), closes [#370](https://github.com/openwhyd/openwhyd/issues/370)

## [1.44.39](https://github.com/openwhyd/openwhyd/compare/v1.44.38...v1.44.39) (2021-05-03)


### Bug Fixes

* **security:** Remove unsafe redirect ([#450](https://github.com/openwhyd/openwhyd/issues/450)) ([5683263](https://github.com/openwhyd/openwhyd/commit/5683263fa5a6caaa1a1aaf6797ecf183caea1ea6))

## [1.44.38](https://github.com/openwhyd/openwhyd/compare/v1.44.37...v1.44.38) (2021-05-01)


### Bug Fixes

* **lint:** Re-format codeql-analysis.yml ([f52a62e](https://github.com/openwhyd/openwhyd/commit/f52a62e19461967e3c0675b34b7751e3f65df502))
* **security:** Make GitHub track security issues ([e4b19c2](https://github.com/openwhyd/openwhyd/commit/e4b19c285eb4f79b641f841ac2b4f0db23d29cea))

## [1.44.37](https://github.com/openwhyd/openwhyd/compare/v1.44.36...v1.44.37) (2021-05-01)


### Bug Fixes

* **deps:** update kramdown ([acd0419](https://github.com/openwhyd/openwhyd/commit/acd0419d32a8b71a8099543572d7108e3a28cc09))

## [1.44.36](https://github.com/openwhyd/openwhyd/compare/v1.44.35...v1.44.36) (2021-05-01)


### Bug Fixes

* **prod:** Simplify (re)start scripts, thanks to pm2 ([f5d314d](https://github.com/openwhyd/openwhyd/commit/f5d314d569b8f8edabfe8b59af4310f8fc83846d))

## [1.44.35](https://github.com/openwhyd/openwhyd/compare/v1.44.34...v1.44.35) (2021-05-01)


### Bug Fixes

* **prod:** Switch from forever to PM2 ([e34c535](https://github.com/openwhyd/openwhyd/commit/e34c535a4d2a301aeb1428d9400927d4a7a40c69)), closes [#151](https://github.com/openwhyd/openwhyd/issues/151)

## [1.44.34](https://github.com/openwhyd/openwhyd/compare/v1.44.33...v1.44.34) (2021-05-01)


### Bug Fixes

* Upgrade Node.js from v12.19.1 to v14.16.1 (LTS) ([#449](https://github.com/openwhyd/openwhyd/issues/449)) ([4aca8f9](https://github.com/openwhyd/openwhyd/commit/4aca8f93b4752e264c21aa13db89481741e44ae5))

## [1.44.33](https://github.com/openwhyd/openwhyd/compare/v1.44.32...v1.44.33) (2021-05-01)


### Bug Fixes

* Add TODOs ([#438](https://github.com/openwhyd/openwhyd/issues/438)) ([469452e](https://github.com/openwhyd/openwhyd/commit/469452ef38081d5d086e913c34389191b3276b57))

## [1.44.32](https://github.com/openwhyd/openwhyd/compare/v1.44.31...v1.44.32) (2021-02-08)


### Bug Fixes

* Login broken in production ([6df09f3](https://github.com/openwhyd/openwhyd/commit/6df09f39385bcae915282833bebe458934c122a6))
* Login broken in production (2) ([f4cb5e0](https://github.com/openwhyd/openwhyd/commit/f4cb5e09295fba8344c78695e9884ea9b1b2fcad))
* Try to re-enable sameSite cookies ([c724637](https://github.com/openwhyd/openwhyd/commit/c72463779114106af77c57d49654bc56b0e0cd2e))

## [1.44.31](https://github.com/openwhyd/openwhyd/compare/v1.44.30...v1.44.31) (2021-02-08)


### Bug Fixes

* **security:** Enable secure and sameSite for session cookies ([#445](https://github.com/openwhyd/openwhyd/issues/445)) ([bdf1d8a](https://github.com/openwhyd/openwhyd/commit/bdf1d8a16c4a229b8d5122c400b9b7275b334f6a))

## [1.44.30](https://github.com/openwhyd/openwhyd/compare/v1.44.29...v1.44.30) (2021-02-07)


### Bug Fixes

* **api:** Follow API returns 404 ([#443](https://github.com/openwhyd/openwhyd/issues/443)) ([0e62b44](https://github.com/openwhyd/openwhyd/commit/0e62b4455e5d8171b28622d69be9902b93a9ae29)), closes [#441](https://github.com/openwhyd/openwhyd/issues/441)

## [1.44.29](https://github.com/openwhyd/openwhyd/compare/v1.44.28...v1.44.29) (2021-02-07)


### Bug Fixes

* **bandcamp:** De-duplicate stream URLs from Bandcamp ([#444](https://github.com/openwhyd/openwhyd/issues/444)) ([f5d5d35](https://github.com/openwhyd/openwhyd/commit/f5d5d35315bc500d2f0f046663b80432b4875161))

## [1.44.28](https://github.com/openwhyd/openwhyd/compare/v1.44.27...v1.44.28) (2021-01-24)


### Bug Fixes

* **#433:** Soundcloud track detection from bookmarklet ([#440](https://github.com/openwhyd/openwhyd/issues/440)) ([01ceadf](https://github.com/openwhyd/openwhyd/commit/01ceadfd2dc7cc44d20e0d5f3c0c10f33dfc6546)), closes [#433](https://github.com/openwhyd/openwhyd/issues/433) [#433](https://github.com/openwhyd/openwhyd/issues/433)

## [1.44.27](https://github.com/openwhyd/openwhyd/compare/v1.44.26...v1.44.27) (2021-01-24)


### Bug Fixes

* **bookmarklet:** "Identifier 'globals' has already been declared" when adding a track ([#439](https://github.com/openwhyd/openwhyd/issues/439)) ([e5e148d](https://github.com/openwhyd/openwhyd/commit/e5e148d2925ba57960ad3845b21c9442fa3ebfa2)), closes [/github.com/openwhyd/openwhyd/pull/429/files#diff-d0670720fd54d514c34d0215269319d1cc83b4fcca7113085edd1040a262febcR3](https://github.com//github.com/openwhyd/openwhyd/pull/429/files/issues/diff-d0670720fd54d514c34d0215269319d1cc83b4fcca7113085edd1040a262febcR3)

## [1.44.26](https://github.com/openwhyd/openwhyd/compare/v1.44.25...v1.44.26) (2021-01-23)


### Bug Fixes

* **deps:** Cypress 6.3.0 ([#428](https://github.com/openwhyd/openwhyd/issues/428)) ([ca64506](https://github.com/openwhyd/openwhyd/commit/ca64506184e3b3a85c858ff7a2a80df642a95135)), closes [/docs.cypress.io/guides/references/changelog.html#6-3-0](https://github.com//docs.cypress.io/guides/references/changelog.html/issues/6-3-0)

## [1.44.25](https://github.com/openwhyd/openwhyd/compare/v1.44.24...v1.44.25) (2021-01-23)


### Bug Fixes

* **deps:** Update eslint and prettier ([#429](https://github.com/openwhyd/openwhyd/issues/429)) ([a4fe26b](https://github.com/openwhyd/openwhyd/commit/a4fe26b9792081c8d9175155605abd228adc54dc))

## [1.44.24](https://github.com/openwhyd/openwhyd/compare/v1.44.23...v1.44.24) (2021-01-23)


### Bug Fixes

* **deps:** Update applitools to 3.18.5 ([#437](https://github.com/openwhyd/openwhyd/issues/437)) ([dd1837d](https://github.com/openwhyd/openwhyd/commit/dd1837d7b01d11acd5f8f99cf149e7c2f422d4b6))

## [1.44.23](https://github.com/openwhyd/openwhyd/compare/v1.44.22...v1.44.23) (2021-01-23)


### Bug Fixes

* **ci:** Detect TS errors and check code quality & formatting in CI ([#430](https://github.com/openwhyd/openwhyd/issues/430)) ([c4b4dee](https://github.com/openwhyd/openwhyd/commit/c4b4dee6a656b2f87ba28d48b8f42e21a3cadf62))

## [1.44.22](https://github.com/openwhyd/openwhyd/compare/v1.44.21...v1.44.22) (2021-01-23)


### Bug Fixes

* **ci:** Revert Applitools configuration for GitHub integration ([#436](https://github.com/openwhyd/openwhyd/issues/436)) ([aaa04f6](https://github.com/openwhyd/openwhyd/commit/aaa04f62540a832d2ef9331c016ba6b7d9074575)), closes [#432](https://github.com/openwhyd/openwhyd/issues/432)

## [1.44.21](https://github.com/openwhyd/openwhyd/compare/v1.44.20...v1.44.21) (2021-01-23)


### Bug Fixes

* **ci:** Add APPLITOOLS_BATCH_ID env var ([#432](https://github.com/openwhyd/openwhyd/issues/432)) ([816e7ff](https://github.com/openwhyd/openwhyd/commit/816e7ff1fad0165f3e1fde3d877044cfccfe34d8))

## [1.44.20](https://github.com/openwhyd/openwhyd/compare/v1.44.19...v1.44.20) (2021-01-23)


### Bug Fixes

* **UI:** Search results blocked by header, when visiting the home page ([#435](https://github.com/openwhyd/openwhyd/issues/435)) ([13745d5](https://github.com/openwhyd/openwhyd/commit/13745d501c0f3d55741e58688cf090b8747eeaa2))

## [1.44.19](https://github.com/openwhyd/openwhyd/compare/v1.44.18...v1.44.19) (2021-01-18)


### Bug Fixes

* **ci:** Don't npm install unless we publish to Docker Hub ([#431](https://github.com/openwhyd/openwhyd/issues/431)) ([b66eb8b](https://github.com/openwhyd/openwhyd/commit/b66eb8b8cc353a848d9b25ea6c81bf5f47335d81))

## [1.44.18](https://github.com/openwhyd/openwhyd/compare/v1.44.17...v1.44.18) (2021-01-17)


### Bug Fixes

* **deps:** Update mongodb 3.1.13 --> 3.6.3 ([#427](https://github.com/openwhyd/openwhyd/issues/427)) ([bf7e3e2](https://github.com/openwhyd/openwhyd/commit/bf7e3e22fba389e78f2cfd620c9e961886c715cb))

## [1.44.17](https://github.com/openwhyd/openwhyd/compare/v1.44.16...v1.44.17) (2021-01-11)


### Bug Fixes

* **deps:** update Nokogiri and jekyll & npm dependencies ([#426](https://github.com/openwhyd/openwhyd/issues/426)) ([8cac2cd](https://github.com/openwhyd/openwhyd/commit/8cac2cd39938df1c97e42b0dc1aaff55fa3f98c4))

## [1.44.16](https://github.com/openwhyd/openwhyd/compare/v1.44.15...v1.44.16) (2021-01-01)


### Bug Fixes

* **CI:** "You're not authorized to push to this branch" ([6457bcb](https://github.com/openwhyd/openwhyd/commit/6457bcb41739b279ceaeaba07af260d5274987b9))
* **CI:** Optimize CI workflow ([#424](https://github.com/openwhyd/openwhyd/issues/424)) ([627e6cc](https://github.com/openwhyd/openwhyd/commit/627e6cc81dc214211509443beb851c531a684727))

## [1.44.15](https://github.com/openwhyd/openwhyd/compare/v1.44.14...v1.44.15) (2020-12-30)


### Bug Fixes

* **env:** Remove SENDGRID_API_USER env var ([#423](https://github.com/openwhyd/openwhyd/issues/423)) ([b91635e](https://github.com/openwhyd/openwhyd/commit/b91635ecc67be409813fd9f6814dd380594c4cac)), closes [#422](https://github.com/openwhyd/openwhyd/issues/422)

## [1.44.14](https://github.com/openwhyd/openwhyd/compare/v1.44.13...v1.44.14) (2020-12-30)


### Bug Fixes

* **email:** Use API key for Sendgrid auth ([#422](https://github.com/openwhyd/openwhyd/issues/422)) ([116bef9](https://github.com/openwhyd/openwhyd/commit/116bef9653c5168c702d4f39f23c154490d3f7e1))

## [1.44.13](https://github.com/openwhyd/openwhyd/compare/v1.44.12...v1.44.13) (2020-12-20)


### Bug Fixes

* **UI:** Broken Profile UI when not logged in ([#421](https://github.com/openwhyd/openwhyd/issues/421)) ([b9ac0b3](https://github.com/openwhyd/openwhyd/commit/b9ac0b313a905d889e0400ab5bfdfc878df62704)), closes [#410](https://github.com/openwhyd/openwhyd/issues/410)

## [1.44.12](https://github.com/openwhyd/openwhyd/compare/v1.44.11...v1.44.12) (2020-12-20)


### Bug Fixes

* **logs:** 🧹 Clean-up and harmonize logs ([#420](https://github.com/openwhyd/openwhyd/issues/420)) ([50ca37a](https://github.com/openwhyd/openwhyd/commit/50ca37a8fab2932a9afa5b8ecf6c5f2925e6742d))

## [1.44.11](https://github.com/openwhyd/openwhyd/compare/v1.44.10...v1.44.11) (2020-12-19)


### Bug Fixes

* **api:** [retry] Regression on Data Export API + side effects between API tests ([#419](https://github.com/openwhyd/openwhyd/issues/419)) ([35e05a1](https://github.com/openwhyd/openwhyd/commit/35e05a1284364965ff0c0cec76b7a50ab1897c67)), closes [#418](https://github.com/openwhyd/openwhyd/issues/418)

## [1.44.10](https://github.com/openwhyd/openwhyd/compare/v1.44.9...v1.44.10) (2020-12-19)


### Reverts

* Revert "fix(api): Regression on Data Export API + side effects between API tests (#418)" ([679cbd7](https://github.com/openwhyd/openwhyd/commit/679cbd752d0c8d8c025b019d022d6d22d060189b)), closes [#418](https://github.com/openwhyd/openwhyd/issues/418)

## [1.44.9](https://github.com/openwhyd/openwhyd/compare/v1.44.8...v1.44.9) (2020-12-19)


### Bug Fixes

* **api:** Regression on Data Export API + side effects between API tests ([#418](https://github.com/openwhyd/openwhyd/issues/418)) ([f4f1466](https://github.com/openwhyd/openwhyd/commit/f4f1466a8bd5bab56fe8ca64004fa439b9a27665))

## [1.44.8](https://github.com/openwhyd/openwhyd/compare/v1.44.7...v1.44.8) (2020-12-19)


### Bug Fixes

* **tests:** Clean up the database between each API test suite ([#417](https://github.com/openwhyd/openwhyd/issues/417)) ([d7ff64e](https://github.com/openwhyd/openwhyd/commit/d7ff64e5dccd8e930e4872a307f781efebd2586f))

## [1.44.7](https://github.com/openwhyd/openwhyd/compare/v1.44.6...v1.44.7) (2020-12-14)


### Bug Fixes

* **tests:** Track visual regressions ([#413](https://github.com/openwhyd/openwhyd/issues/413)) ([7c48ba0](https://github.com/openwhyd/openwhyd/commit/7c48ba0c262a9aac4984f090a7a868241420d745))

## [1.44.6](https://github.com/openwhyd/openwhyd/compare/v1.44.5...v1.44.6) (2020-12-05)


### Bug Fixes

* **contributors:** Add Jeff Hsr ([de606be](https://github.com/openwhyd/openwhyd/commit/de606be36ef30a620bd4027f3b7060951b96b3db))

## [1.44.5](https://github.com/openwhyd/openwhyd/compare/v1.44.4...v1.44.5) (2020-12-05)


### Bug Fixes

* **contributors:** Add @Salayna, [@wen-chan](https://github.com/wen-chan), [@agathe-vaisse](https://github.com/agathe-vaisse) and [@i](https://github.com/i)NeoO ([7497a5d](https://github.com/openwhyd/openwhyd/commit/7497a5d2c07583871caf7944b4d7a1084b89903f))

## [1.44.4](https://github.com/openwhyd/openwhyd/compare/v1.44.3...v1.44.4) (2020-12-05)


### Bug Fixes

* **contributors:** Fix broken avatars ([d096c3f](https://github.com/openwhyd/openwhyd/commit/d096c3f9a3762daa368e4c93fe64e59318d0ffe9))

## [1.44.3](https://github.com/openwhyd/openwhyd/compare/v1.44.2...v1.44.3) (2020-12-05)


### Bug Fixes

* **contributors:** add [@compiuta](https://github.com/compiuta) + remove dep to all-contributors ([91156b8](https://github.com/openwhyd/openwhyd/commit/91156b8694f38fd69ad08675df69e7f95f3650cb))
* **README:** Make README more concise ([42e0295](https://github.com/openwhyd/openwhyd/commit/42e02955bef4e2b65cd5bccd24a32d83e1873709))

## [1.44.2](https://github.com/openwhyd/openwhyd/compare/v1.44.1...v1.44.2) (2020-11-30)


### Bug Fixes

* **ui:** Sort playlist feature bug ([#415](https://github.com/openwhyd/openwhyd/issues/415)) ([aec724d](https://github.com/openwhyd/openwhyd/commit/aec724d51d0a7abe600c10dabc0a26c5441131b7)), closes [#411](https://github.com/openwhyd/openwhyd/issues/411)

## [1.44.1](https://github.com/openwhyd/openwhyd/compare/v1.44.0...v1.44.1) (2020-11-29)


### Bug Fixes

* **debug:** Track front-end errors with Datadog RUM ([#412](https://github.com/openwhyd/openwhyd/issues/412)) ([f4719e7](https://github.com/openwhyd/openwhyd/commit/f4719e7b26f64b2d5e4203f8c1195a440476db3f))

# [1.44.0](https://github.com/openwhyd/openwhyd/compare/v1.43.1...v1.44.0) (2020-11-28)


### Features

* **onboarding:** Simplify onboarding process ([#409](https://github.com/openwhyd/openwhyd/issues/409)) ([ec40c7d](https://github.com/openwhyd/openwhyd/commit/ec40c7de7eedc35662398b5cc9045e90e9253e00)), closes [#163](https://github.com/openwhyd/openwhyd/issues/163)

## [1.43.1](https://github.com/openwhyd/openwhyd/compare/v1.43.0...v1.43.1) (2020-11-28)


### Bug Fixes

* **bookmaklet:** Transpile changes form [#408](https://github.com/openwhyd/openwhyd/issues/408) to JS ([59f6f98](https://github.com/openwhyd/openwhyd/commit/59f6f9847ca55c0aed62fabe12253a698867e3e3))
* **bookmarklet:** Re-add PlayemJS in bookmarklet ([#408](https://github.com/openwhyd/openwhyd/issues/408)), for track detection ([8fd1a3e](https://github.com/openwhyd/openwhyd/commit/8fd1a3ee34018210b0e7ecc5e0baf9bf223f2f8c))
* **bookmarklet:** Remove PlayemJS from bookmarklet ([#408](https://github.com/openwhyd/openwhyd/issues/408)) ([7296b21](https://github.com/openwhyd/openwhyd/commit/7296b2115a231ac3210d453caf3673a2fdd29c71)), closes [#272](https://github.com/openwhyd/openwhyd/issues/272) [#262](https://github.com/openwhyd/openwhyd/issues/262) [#192](https://github.com/openwhyd/openwhyd/issues/192) [#190](https://github.com/openwhyd/openwhyd/issues/190) [#143](https://github.com/openwhyd/openwhyd/issues/143) [#132](https://github.com/openwhyd/openwhyd/issues/132) [#128](https://github.com/openwhyd/openwhyd/issues/128) [#16](https://github.com/openwhyd/openwhyd/issues/16)

# [1.43.0](https://github.com/openwhyd/openwhyd/compare/v1.42.7...v1.43.0) (2020-11-28)


### Features

* **facebook:** Remove calls to Facebook Opengraph ([#407](https://github.com/openwhyd/openwhyd/issues/407)) ([156593d](https://github.com/openwhyd/openwhyd/commit/156593d617066cfaa1d4abb8281b560b91193789))

## [1.42.7](https://github.com/openwhyd/openwhyd/compare/v1.42.6...v1.42.7) (2020-11-28)


### Bug Fixes

* **clean:** Remove the "whyd badge" + "Goodies" tab from Settings page ([614b0b0](https://github.com/openwhyd/openwhyd/commit/614b0b0708fcb3b298e8157f4dcc4d69ea7e974b))
* **clean:** Remove unused assets from /public/images/welcome ([4ae5950](https://github.com/openwhyd/openwhyd/commit/4ae595078cbf9ccfb2e5bfbddb3c478eba3796ef))
* **sidebox:** Invite to join our community on Facebook ([6096795](https://github.com/openwhyd/openwhyd/commit/609679558f592277263e85b22b9b85255c256f70))
* **test:** "CypressError: Timed out retrying: `cy.scrollTo()` failed because this element is not scrollable" ([9f1e449](https://github.com/openwhyd/openwhyd/commit/9f1e4490d75ba643f3fd53b04632896c64107452))

## [1.42.6](https://github.com/openwhyd/openwhyd/compare/v1.42.5...v1.42.6) (2020-11-22)


### Bug Fixes

* **tests:** Track test coverage data using nyc ([#406](https://github.com/openwhyd/openwhyd/issues/406)) ([1a57c2e](https://github.com/openwhyd/openwhyd/commit/1a57c2ecf6fe1b0921ab788acda39c3b21d882e0))

## [1.42.5](https://github.com/openwhyd/openwhyd/compare/v1.42.4...v1.42.5) (2020-11-22)


### Bug Fixes

* **perf:** Close MongoDB cursors after calling forEach2() ([#405](https://github.com/openwhyd/openwhyd/issues/405)) ([3f1ec06](https://github.com/openwhyd/openwhyd/commit/3f1ec06710a3628d0252ecf2adf4b72a270ab823))

## [1.42.4](https://github.com/openwhyd/openwhyd/compare/v1.42.3...v1.42.4) (2020-11-22)


### Bug Fixes

* **perf:** Reduce use of synchronous IO calls ([#404](https://github.com/openwhyd/openwhyd/issues/404)) ([2cb41b3](https://github.com/openwhyd/openwhyd/commit/2cb41b3f6e4d3bd3a4fca2a67c71d1de6603bbc3))

## [1.42.3](https://github.com/openwhyd/openwhyd/compare/v1.42.2...v1.42.3) (2020-11-21)


### Bug Fixes

* **ui:** Never-ending refresh of full stream ([#401](https://github.com/openwhyd/openwhyd/issues/401)) ([9cfa33c](https://github.com/openwhyd/openwhyd/commit/9cfa33c50d31f3f20a165d575580c440aea73cea)), closes [#397](https://github.com/openwhyd/openwhyd/issues/397)

## [1.42.2](https://github.com/openwhyd/openwhyd/compare/v1.42.1...v1.42.2) (2020-11-21)


### Bug Fixes

* **makefile:** "/bin/sh: 1: nvm: not found" ([93b53b1](https://github.com/openwhyd/openwhyd/commit/93b53b10908512a116ae04216552c9ccb8795aed))

## [1.42.1](https://github.com/openwhyd/openwhyd/compare/v1.42.0...v1.42.1) (2020-11-21)


### Bug Fixes

* **nodejs:** Switch to Node.js 12 ([#400](https://github.com/openwhyd/openwhyd/issues/400)) ([50eb966](https://github.com/openwhyd/openwhyd/commit/50eb9660c9d1238719ea852e4f7d39193bbf4897))

# [1.42.0](https://github.com/openwhyd/openwhyd/compare/v1.41.1...v1.42.0) (2020-11-21)


### Features

* Remove genres from onboarding and hot tracks ([#399](https://github.com/openwhyd/openwhyd/issues/399)) ([0dc8ed5](https://github.com/openwhyd/openwhyd/commit/0dc8ed5a6f09e8d380e3a2b3b8fae581148d1c20)), closes [#397](https://github.com/openwhyd/openwhyd/issues/397)

## [1.41.1](https://github.com/openwhyd/openwhyd/compare/v1.41.0...v1.41.1) (2020-11-16)


### Bug Fixes

* **player:** Cancel background playback again ([758e998](https://github.com/openwhyd/openwhyd/commit/758e998f23677ed7fdd22c3cd95b71d9733f5aca)), closes [#132](https://github.com/openwhyd/openwhyd/issues/132)

# [1.41.0](https://github.com/openwhyd/openwhyd/compare/v1.40.6...v1.41.0) (2020-11-16)


### Features

* **player:** Enable background playback ([#396](https://github.com/openwhyd/openwhyd/issues/396)) ([dbaa420](https://github.com/openwhyd/openwhyd/commit/dbaa42053ecfb168393653f1c1bcb65110ec4ef4))

## [1.40.6](https://github.com/openwhyd/openwhyd/compare/v1.40.5...v1.40.6) (2020-11-15)


### Bug Fixes

* Check that the API was called from our own domain ([#395](https://github.com/openwhyd/openwhyd/issues/395)) ([68bc33c](https://github.com/openwhyd/openwhyd/commit/68bc33c953d4b5d297958698d6a5bff1c90517a5))

## [1.40.5](https://github.com/openwhyd/openwhyd/compare/v1.40.4...v1.40.5) (2020-11-15)


### Bug Fixes

* **bandcamp:** Fetch the stream URL from the track's page ([#394](https://github.com/openwhyd/openwhyd/issues/394)) ([439304f](https://github.com/openwhyd/openwhyd/commit/439304fa85d92cdfc144e5e0ac859768eafef1ef)), closes [#117](https://github.com/openwhyd/openwhyd/issues/117)

## [1.40.4](https://github.com/openwhyd/openwhyd/compare/v1.40.3...v1.40.4) (2020-11-14)


### Bug Fixes

* **monitoring:** add Datadog APM ([626bd9c](https://github.com/openwhyd/openwhyd/commit/626bd9cd3942a3c13e8725e7b769d6d1771a6cc5))

## [1.40.3](https://github.com/openwhyd/openwhyd/compare/v1.40.2...v1.40.3) (2020-11-11)


### Bug Fixes

* **bookmarklet:** Extract pageDetectors and urlDetectors to separate files ([#393](https://github.com/openwhyd/openwhyd/issues/393)) ([b0711b2](https://github.com/openwhyd/openwhyd/commit/b0711b297f9c88cfe17164a5d3f0e1516e7e7fa3)), closes [#381](https://github.com/openwhyd/openwhyd/issues/381)

## [1.40.2](https://github.com/openwhyd/openwhyd/compare/v1.40.1...v1.40.2) (2020-11-11)


### Bug Fixes

* Various hotfixes ([#392](https://github.com/openwhyd/openwhyd/issues/392)) ([96d17bb](https://github.com/openwhyd/openwhyd/commit/96d17bbadead687384800e5ca804e7f148dbe45a))

## [1.40.1](https://github.com/openwhyd/openwhyd/compare/v1.40.0...v1.40.1) (2020-11-11)


### Bug Fixes

* **codacy:** Fix code quality issues listed by Codacy ([#391](https://github.com/openwhyd/openwhyd/issues/391)) ([df00b67](https://github.com/openwhyd/openwhyd/commit/df00b679c01c70aa63a49a18970c01db0093f334)), closes [17325385#l49](https://github.com/17325385/issues/l49)

# [1.40.0](https://github.com/openwhyd/openwhyd/compare/v1.39.1...v1.40.0) (2020-11-11)


### Features

* Remove "City" pages ([#390](https://github.com/openwhyd/openwhyd/issues/390)) ([9c20c0f](https://github.com/openwhyd/openwhyd/commit/9c20c0fd3acc45a775137bc0b50923ddc5fd8108)), closes [#318](https://github.com/openwhyd/openwhyd/issues/318)

## [1.39.1](https://github.com/openwhyd/openwhyd/compare/v1.39.0...v1.39.1) (2020-11-11)


### Bug Fixes

* Finish removal of "Playlist Contest" ([#389](https://github.com/openwhyd/openwhyd/issues/389)) ([4a2bf52](https://github.com/openwhyd/openwhyd/commit/4a2bf52d1c5a595adebdbe8ad750ea2457a1010b)), closes [#388](https://github.com/openwhyd/openwhyd/issues/388)

# [1.39.0](https://github.com/openwhyd/openwhyd/compare/v1.38.0...v1.39.0) (2020-11-11)


### Features

* Remove "Playlist Contest" ([#388](https://github.com/openwhyd/openwhyd/issues/388)) ([39bd559](https://github.com/openwhyd/openwhyd/commit/39bd5593bc491ffdcf3ceadc04eb9b8fd8769390)), closes [#318](https://github.com/openwhyd/openwhyd/issues/318)

# [1.38.0](https://github.com/openwhyd/openwhyd/compare/v1.37.7...v1.38.0) (2020-11-11)


### Features

* Remove Discover page + suggested users ([#387](https://github.com/openwhyd/openwhyd/issues/387)) ([7df753e](https://github.com/openwhyd/openwhyd/commit/7df753ec6891a1d6125869b0a67d2f05ea8dca29)), closes [#318](https://github.com/openwhyd/openwhyd/issues/318)

## [1.37.7](https://github.com/openwhyd/openwhyd/compare/v1.37.6...v1.37.7) (2020-11-10)


### Bug Fixes

* Remove slow routes ([#386](https://github.com/openwhyd/openwhyd/issues/386)) ([0ac5e41](https://github.com/openwhyd/openwhyd/commit/0ac5e41889ff8ea70afbc026bc52b2b1737ab8b0)), closes [#318](https://github.com/openwhyd/openwhyd/issues/318) [#202](https://github.com/openwhyd/openwhyd/issues/202) [#144](https://github.com/openwhyd/openwhyd/issues/144) [/github.com/openwhyd/openwhyd/issues/318#issuecomment-724748867](https://github.com//github.com/openwhyd/openwhyd/issues/318/issues/issuecomment-724748867)

## [1.37.6](https://github.com/openwhyd/openwhyd/compare/v1.37.5...v1.37.6) (2020-11-08)


### Bug Fixes

* Hotfixes ([#385](https://github.com/openwhyd/openwhyd/issues/385)) ([15a8b9a](https://github.com/openwhyd/openwhyd/commit/15a8b9a128fb0ce79c5074d24d5faf5297024aea))

## [1.37.5](https://github.com/openwhyd/openwhyd/compare/v1.37.4...v1.37.5) (2020-11-08)


### Bug Fixes

* **bookmarklet:** Split bookmarklet.js into separate TypeScript files ([#384](https://github.com/openwhyd/openwhyd/issues/384)) ([a1d03dc](https://github.com/openwhyd/openwhyd/commit/a1d03dc8e64395b2f23e52304d01866861b7e2f6)), closes [#381](https://github.com/openwhyd/openwhyd/issues/381)

## [1.37.4](https://github.com/openwhyd/openwhyd/compare/v1.37.3...v1.37.4) (2020-11-08)


### Bug Fixes

* **docker:** Make Docker build faster ([#383](https://github.com/openwhyd/openwhyd/issues/383)) ([04b82c5](https://github.com/openwhyd/openwhyd/commit/04b82c58ec42c90e231cd4a1dbfad79e5c0175a9))

## [1.37.3](https://github.com/openwhyd/openwhyd/compare/v1.37.2...v1.37.3) (2020-11-08)


### Bug Fixes

* **bookmarklet:** Detect cover art from Bandcamp page ([#377](https://github.com/openwhyd/openwhyd/issues/377)) ([e5bd75b](https://github.com/openwhyd/openwhyd/commit/e5bd75b02689a16981a0222c04e6a89f62b2101b))

## [1.37.2](https://github.com/openwhyd/openwhyd/compare/v1.37.1...v1.37.2) (2020-11-08)


### Bug Fixes

* **379:** Load templates synchronously, to prevent crash on CI ([#382](https://github.com/openwhyd/openwhyd/issues/382)) ([06260a9](https://github.com/openwhyd/openwhyd/commit/06260a9429fa14e9a62a027eee93d4ee4370e602)), closes [#379](https://github.com/openwhyd/openwhyd/issues/379)

## [1.37.1](https://github.com/openwhyd/openwhyd/compare/v1.37.0...v1.37.1) (2020-11-08)


### Bug Fixes

* Remove Barelog / Productfeed ([#380](https://github.com/openwhyd/openwhyd/issues/380)) ([3115c01](https://github.com/openwhyd/openwhyd/commit/3115c01bca576e2f7be6b6c9cfa77462df57867f))

# [1.37.0](https://github.com/openwhyd/openwhyd/compare/v1.36.4...v1.37.0) (2020-11-07)


### Features

* **UI:** Latest tracks on landing page ([#378](https://github.com/openwhyd/openwhyd/issues/378)) ([5e1471d](https://github.com/openwhyd/openwhyd/commit/5e1471d9a215356e994034df8a511dcc4d815e05)), closes [#182](https://github.com/openwhyd/openwhyd/issues/182)

## [1.36.4](https://github.com/openwhyd/openwhyd/compare/v1.36.3...v1.36.4) (2020-11-01)


### Bug Fixes

* **deps:** Update kramdown dependency ([#376](https://github.com/openwhyd/openwhyd/issues/376)) ([7e742eb](https://github.com/openwhyd/openwhyd/commit/7e742ebdf75dd87f3a154d2c3db02b53e1b638d4))

## [1.36.3](https://github.com/openwhyd/openwhyd/compare/v1.36.2...v1.36.3) (2020-11-01)


### Bug Fixes

* **deps:** Migrate from MongoDB 2.2.36 to 3.1.13 ([#356](https://github.com/openwhyd/openwhyd/issues/356)) ([75fa55c](https://github.com/openwhyd/openwhyd/commit/75fa55ce6e287eed6644f2e29e47e438d1f8e33e))

## [1.36.2](https://github.com/openwhyd/openwhyd/compare/v1.36.1...v1.36.2) (2020-11-01)


### Bug Fixes

* **deps:** Clean-up dependencies ([#375](https://github.com/openwhyd/openwhyd/issues/375)) ([2ab1f9e](https://github.com/openwhyd/openwhyd/commit/2ab1f9eed29b79b621c8422c27949db8ca46644b))

## [1.36.1](https://github.com/openwhyd/openwhyd/compare/v1.36.0...v1.36.1) (2020-11-01)


### Bug Fixes

* **importer:** Fix navigation and login after importing user data locally ([#373](https://github.com/openwhyd/openwhyd/issues/373)) ([6a1b503](https://github.com/openwhyd/openwhyd/commit/6a1b5030e4c03e3587d18dac27591e1c126369a2))

# [1.36.0](https://github.com/openwhyd/openwhyd/compare/v1.35.3...v1.36.0) (2020-11-01)


### Bug Fixes

* **tests:** Workaround "quota exceeded" errors from YouTube API ([#374](https://github.com/openwhyd/openwhyd/issues/374)) ([53807af](https://github.com/openwhyd/openwhyd/commit/53807af0e0c9733e94cebf9dff8df8ee9be8c4cb))


### Features

* Add alphabetical order to playlists page ([#372](https://github.com/openwhyd/openwhyd/issues/372)) ([9ce65ac](https://github.com/openwhyd/openwhyd/commit/9ce65ac8fd95f57f0732e191979ea104ab5b6a62)), closes [#371](https://github.com/openwhyd/openwhyd/issues/371)

## [1.35.3](https://github.com/openwhyd/openwhyd/compare/v1.35.2...v1.35.3) (2020-09-07)


### Bug Fixes

* **linter:** Re-enable linting of JS files in VSCode ([#367](https://github.com/openwhyd/openwhyd/issues/367)) ([469e9aa](https://github.com/openwhyd/openwhyd/commit/469e9aa0d440fe4792f7b229c1e8ba6543998498))

## [1.35.2](https://github.com/openwhyd/openwhyd/compare/v1.35.1...v1.35.2) (2020-09-06)


### Bug Fixes

* **tests:** Modernize unit tests of Notifications ([#366](https://github.com/openwhyd/openwhyd/issues/366)) ([2233e2d](https://github.com/openwhyd/openwhyd/commit/2233e2dabfdae116ed3fb957c77573d6158788bc)), closes [#212](https://github.com/openwhyd/openwhyd/issues/212)

## [1.35.1](https://github.com/openwhyd/openwhyd/compare/v1.35.0...v1.35.1) (2020-09-06)


### Bug Fixes

* **logs:** Remove or clarify old production + unit test logs ([#365](https://github.com/openwhyd/openwhyd/issues/365)) ([b22d871](https://github.com/openwhyd/openwhyd/commit/b22d87132861f57c0ff83634597b28c4c1b69b49))

# [1.35.0](https://github.com/openwhyd/openwhyd/compare/v1.34.23...v1.35.0) (2020-09-06)


### Features

* ⚰️ Bury collaborative playlists (never-finished feature) ([#364](https://github.com/openwhyd/openwhyd/issues/364)) ([9a342fa](https://github.com/openwhyd/openwhyd/commit/9a342fa1fdf50282b0ea86d3ad9a1604dcac82ea))

## [1.34.23](https://github.com/openwhyd/openwhyd/compare/v1.34.22...v1.34.23) (2020-09-06)


### Bug Fixes

* **logs:** Reduce amount of logging in production ([#363](https://github.com/openwhyd/openwhyd/issues/363)) ([4b5efce](https://github.com/openwhyd/openwhyd/commit/4b5efce5772216afdbe9bee68346ee920445088a))

## [1.34.22](https://github.com/openwhyd/openwhyd/compare/v1.34.21...v1.34.22) (2020-09-05)


### Bug Fixes

* **tests:** Test avatar upload ([#362](https://github.com/openwhyd/openwhyd/issues/362)) ([04c4f91](https://github.com/openwhyd/openwhyd/commit/04c4f919e6b0de278faa3623541ba55229c2685e)), closes [#358](https://github.com/openwhyd/openwhyd/issues/358) [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.34.21](https://github.com/openwhyd/openwhyd/compare/v1.34.20...v1.34.21) (2020-09-05)


### Bug Fixes

* **logs:** Re-import colors package, to prevent "undefined" entries in logs ([#361](https://github.com/openwhyd/openwhyd/issues/361)) ([14c3032](https://github.com/openwhyd/openwhyd/commit/14c3032083d5c75c5efd1e4d871ffc7c16a02d9f))

## [1.34.20](https://github.com/openwhyd/openwhyd/compare/v1.34.19...v1.34.20) (2020-09-05)


### Bug Fixes

* **deps:** Update dependencies ([#360](https://github.com/openwhyd/openwhyd/issues/360)) ([3ad78f6](https://github.com/openwhyd/openwhyd/commit/3ad78f64081c6552137d65642d2716a6069688f9))

## [1.34.19](https://github.com/openwhyd/openwhyd/compare/v1.34.18...v1.34.19) (2020-09-05)


### Bug Fixes

* **e2e-tests:** Finish migration from Webdriver to Cypress ([#358](https://github.com/openwhyd/openwhyd/issues/358)) ([5eccaa7](https://github.com/openwhyd/openwhyd/commit/5eccaa7)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.34.18](https://github.com/openwhyd/openwhyd/compare/v1.34.17...v1.34.18) (2020-09-01)


### Bug Fixes

* **css:** Remove obsolete definitions ([#350](https://github.com/openwhyd/openwhyd/issues/350)) ([44d4445](https://github.com/openwhyd/openwhyd/commit/44d4445))

## [1.34.17](https://github.com/openwhyd/openwhyd/compare/v1.34.16...v1.34.17) (2020-08-30)


### Bug Fixes

* **lint:** Fix ESLint & Codacy issues ([#348](https://github.com/openwhyd/openwhyd/issues/348)) ([440dda6](https://github.com/openwhyd/openwhyd/commit/440dda6)), closes [#346](https://github.com/openwhyd/openwhyd/issues/346)

## [1.34.16](https://github.com/openwhyd/openwhyd/compare/v1.34.15...v1.34.16) (2020-08-30)


### Bug Fixes

* **clean-up:** Adjust ESLint/Codacy rules + fix some issues ([#346](https://github.com/openwhyd/openwhyd/issues/346)) ([c4d08a9](https://github.com/openwhyd/openwhyd/commit/c4d08a9))

## [1.34.15](https://github.com/openwhyd/openwhyd/compare/v1.34.14...v1.34.15) (2020-08-30)


### Bug Fixes

* Cannot add a track from bookmarklet ([#347](https://github.com/openwhyd/openwhyd/issues/347)) ([0c66c52](https://github.com/openwhyd/openwhyd/commit/0c66c52))

## [1.34.14](https://github.com/openwhyd/openwhyd/compare/v1.34.13...v1.34.14) (2020-08-29)


### Bug Fixes

* **clean-up:** `npm run lint:fix` to also format HTML files ([#345](https://github.com/openwhyd/openwhyd/issues/345)) ([950d981](https://github.com/openwhyd/openwhyd/commit/950d981)), closes [#300](https://github.com/openwhyd/openwhyd/issues/300)

## [1.34.13](https://github.com/openwhyd/openwhyd/compare/v1.34.12...v1.34.13) (2020-08-29)


### Bug Fixes

* **clean-up:** Setup linter and formatting => apply to (almost) all files ([#344](https://github.com/openwhyd/openwhyd/issues/344)) ([224def8](https://github.com/openwhyd/openwhyd/commit/224def8)), closes [#300](https://github.com/openwhyd/openwhyd/issues/300)

## [1.34.12](https://github.com/openwhyd/openwhyd/compare/v1.34.11...v1.34.12) (2020-08-29)


### Bug Fixes

* **clean-up:** Remove swfobject and other unused scripts and pages ([#343](https://github.com/openwhyd/openwhyd/issues/343)) ([fb94438](https://github.com/openwhyd/openwhyd/commit/fb94438))

## [1.34.11](https://github.com/openwhyd/openwhyd/compare/v1.34.10...v1.34.11) (2020-08-27)


### Bug Fixes

* **deps:** Update ESLint and Prettier + plugins ([#341](https://github.com/openwhyd/openwhyd/issues/341)) ([b8c7728](https://github.com/openwhyd/openwhyd/commit/b8c7728)), closes [/github.com/openwhyd/openwhyd/pull/335#issuecomment-680291284](https://github.com//github.com/openwhyd/openwhyd/pull/335/issues/issuecomment-680291284)

## [1.34.10](https://github.com/openwhyd/openwhyd/compare/v1.34.9...v1.34.10) (2020-08-27)


### Bug Fixes

* **tests:** Migrate tests of email notifications from WebDriver to Cypress ([#342](https://github.com/openwhyd/openwhyd/issues/342)) ([c640c4c](https://github.com/openwhyd/openwhyd/commit/c640c4c)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.34.9](https://github.com/openwhyd/openwhyd/compare/v1.34.8...v1.34.9) (2020-08-25)


### Bug Fixes

* **tests:** Migrate 2 tests from Webdriver to Cypress ([#335](https://github.com/openwhyd/openwhyd/issues/335)) ([36451d9](https://github.com/openwhyd/openwhyd/commit/36451d9))

## [1.34.8](https://github.com/openwhyd/openwhyd/compare/v1.34.7...v1.34.8) (2020-08-25)


### Bug Fixes

* **int:** Codacy still thinks we want double quotes ([#340](https://github.com/openwhyd/openwhyd/issues/340)) ([c59240a](https://github.com/openwhyd/openwhyd/commit/c59240a))
* **lint:** Expect single quotes ([#339](https://github.com/openwhyd/openwhyd/issues/339)) ([9c46ed6](https://github.com/openwhyd/openwhyd/commit/9c46ed6))

## [1.34.7](https://github.com/openwhyd/openwhyd/compare/v1.34.6...v1.34.7) (2020-08-25)


### Bug Fixes

* **lint:** Also lint TypeScripts files ([#338](https://github.com/openwhyd/openwhyd/issues/338)) ([9fcbf97](https://github.com/openwhyd/openwhyd/commit/9fcbf97))

## [1.34.6](https://github.com/openwhyd/openwhyd/compare/v1.34.5...v1.34.6) (2020-08-25)


### Bug Fixes

* **CI:** Expect semantic commit message just for PR title ([#337](https://github.com/openwhyd/openwhyd/issues/337)) ([9717160](https://github.com/openwhyd/openwhyd/commit/9717160))

## [1.34.5](https://github.com/openwhyd/openwhyd/compare/v1.34.4...v1.34.5) (2020-08-25)


### Bug Fixes

* **CI:** Force cypress v3.8.3 on the Docker Workflow ([#336](https://github.com/openwhyd/openwhyd/issues/336)) ([63a3e1e](https://github.com/openwhyd/openwhyd/commit/63a3e1e)), closes [#333](https://github.com/openwhyd/openwhyd/issues/333)

## [1.34.4](https://github.com/openwhyd/openwhyd/compare/v1.34.3...v1.34.4) (2020-07-11)


### Bug Fixes

* **announcement:** look for mobile app developer ([e0fc143](https://github.com/openwhyd/openwhyd/commit/e0fc143))

## [1.34.3](https://github.com/openwhyd/openwhyd/compare/v1.34.2...v1.34.3) (2020-07-11)


### Bug Fixes

* **facebook:** remove the `user_friends` scope ([f0ce783](https://github.com/openwhyd/openwhyd/commit/f0ce783)), closes [#330](https://github.com/openwhyd/openwhyd/issues/330)
* **tests:** disable test that relies on a 3rd-party web page ([00cf365](https://github.com/openwhyd/openwhyd/commit/00cf365))

## [1.34.2](https://github.com/openwhyd/openwhyd/compare/v1.34.1...v1.34.2) (2020-04-16)


### Bug Fixes

* **ui:** redirect error when landing on rankings page ([#321](https://github.com/openwhyd/openwhyd/issues/321)) ([8e6040e](https://github.com/openwhyd/openwhyd/commit/8e6040e))

## [1.34.1](https://github.com/openwhyd/openwhyd/compare/v1.34.0...v1.34.1) (2020-04-05)


### Bug Fixes

* **release:** attempt to publish tags on docker hub ([#320](https://github.com/openwhyd/openwhyd/issues/320)) ([bc64ec0](https://github.com/openwhyd/openwhyd/commit/bc64ec0)), closes [#306](https://github.com/openwhyd/openwhyd/issues/306) [/github.com/jerray/publish-docker-action/issues/11#issuecomment-607077257](https://github.com//github.com/jerray/publish-docker-action/issues/11/issues/issuecomment-607077257)

# [1.34.0](https://github.com/openwhyd/openwhyd/compare/v1.33.6...v1.34.0) (2020-03-28)


### Features

* **deps:** upgrade playemjs to get rid of flash/swfobject ([#317](https://github.com/openwhyd/openwhyd/issues/317)) ([f2a0ce6](https://github.com/openwhyd/openwhyd/commit/f2a0ce6))

## [1.33.6](https://github.com/openwhyd/openwhyd/compare/v1.33.5...v1.33.6) (2020-03-28)


### Bug Fixes

* **docker:** use slim node docker image ([#312](https://github.com/openwhyd/openwhyd/issues/312)) ([b9d58ae](https://github.com/openwhyd/openwhyd/commit/b9d58ae)), closes [#309](https://github.com/openwhyd/openwhyd/issues/309)

## [1.33.5](https://github.com/openwhyd/openwhyd/compare/v1.33.4...v1.33.5) (2020-03-28)


### Bug Fixes

* **prod:** use latest version of forever in prod scripts ([#315](https://github.com/openwhyd/openwhyd/issues/315)) ([e2061f5](https://github.com/openwhyd/openwhyd/commit/e2061f5))

## [1.33.4](https://github.com/openwhyd/openwhyd/compare/v1.33.3...v1.33.4) (2020-03-28)


### Bug Fixes

* **deps:** upgrade to (smaller) playemjs v0.3.1 ([#314](https://github.com/openwhyd/openwhyd/issues/314)) ([4ea4237](https://github.com/openwhyd/openwhyd/commit/4ea4237)), closes [#309](https://github.com/openwhyd/openwhyd/issues/309) [/github.com/openwhyd/openwhyd/issues/309#issuecomment-605508547](https://github.com//github.com/openwhyd/openwhyd/issues/309/issues/issuecomment-605508547)

## [1.33.3](https://github.com/openwhyd/openwhyd/compare/v1.33.2...v1.33.3) (2020-03-28)


### Bug Fixes

* **deps:** remove forever from dependencies ([#313](https://github.com/openwhyd/openwhyd/issues/313)) ([b41699d](https://github.com/openwhyd/openwhyd/commit/b41699d)), closes [#309](https://github.com/openwhyd/openwhyd/issues/309)

## [1.33.2](https://github.com/openwhyd/openwhyd/compare/v1.33.1...v1.33.2) (2020-03-28)


### Bug Fixes

* **browser-ext:** add assets for Chrome Web Store page ([#310](https://github.com/openwhyd/openwhyd/issues/310)) ([925d64d](https://github.com/openwhyd/openwhyd/commit/925d64d))

## [1.33.1](https://github.com/openwhyd/openwhyd/compare/v1.33.0...v1.33.1) (2020-03-28)


### Bug Fixes

* **docker:** ignore log files ([#311](https://github.com/openwhyd/openwhyd/issues/311)) ([5b83c07](https://github.com/openwhyd/openwhyd/commit/5b83c07)), closes [#309](https://github.com/openwhyd/openwhyd/issues/309) [#306](https://github.com/openwhyd/openwhyd/issues/306)

# [1.33.0](https://github.com/openwhyd/openwhyd/compare/v1.32.0...v1.33.0) (2020-03-28)


### Features

* **ci:** add version as tag, when publishing on Docker Hub ([#306](https://github.com/openwhyd/openwhyd/issues/306)) ([dca5597](https://github.com/openwhyd/openwhyd/commit/dca5597))

# [1.32.0](https://github.com/openwhyd/openwhyd/compare/v1.31.0...v1.32.0) (2020-03-28)


### Features

* **ci:** prevent regressions on our Docker image ([#308](https://github.com/openwhyd/openwhyd/issues/308)) ([c927534](https://github.com/openwhyd/openwhyd/commit/c927534)), closes [#306](https://github.com/openwhyd/openwhyd/issues/306)

# [1.31.0](https://github.com/openwhyd/openwhyd/compare/v1.30.6...v1.31.0) (2020-03-28)


### Features

* **logs:** Simplify logging to stdout and stderr ([#305](https://github.com/openwhyd/openwhyd/issues/305)) ([62fe0ba](https://github.com/openwhyd/openwhyd/commit/62fe0ba))

## [1.30.6](https://github.com/openwhyd/openwhyd/compare/v1.30.5...v1.30.6) (2020-03-23)


### Bug Fixes

* **ui:** Resizing the page should not scroll to the top ([#303](https://github.com/openwhyd/openwhyd/issues/303)) ([1e43e68](https://github.com/openwhyd/openwhyd/commit/1e43e68)), closes [#20](https://github.com/openwhyd/openwhyd/issues/20)

## [1.30.5](https://github.com/openwhyd/openwhyd/compare/v1.30.4...v1.30.5) (2020-03-22)


### Bug Fixes

* **tests:** Migrate acceptance tests from Webdriver to Cypress ([#301](https://github.com/openwhyd/openwhyd/issues/301)) ([2f6de36](https://github.com/openwhyd/openwhyd/commit/2f6de36)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.30.4](https://github.com/openwhyd/openwhyd/compare/v1.30.3...v1.30.4) (2020-03-22)


### Bug Fixes

* **tests:** create dummy posts from cypress tests instead of from initdb_testing ([#304](https://github.com/openwhyd/openwhyd/issues/304)) ([e37a0d0](https://github.com/openwhyd/openwhyd/commit/e37a0d0)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.30.3](https://github.com/openwhyd/openwhyd/compare/v1.30.2...v1.30.3) (2020-03-22)


### Bug Fixes

* **tests:** Reset database between each Cypress tests ([#302](https://github.com/openwhyd/openwhyd/issues/302)) ([ced6038](https://github.com/openwhyd/openwhyd/commit/ced6038)), closes [#301](https://github.com/openwhyd/openwhyd/issues/301) [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.30.2](https://github.com/openwhyd/openwhyd/compare/v1.30.1...v1.30.2) (2020-03-22)


### Bug Fixes

* **ui:** Display correct track error message when using electron app ([#294](https://github.com/openwhyd/openwhyd/issues/294)) ([4f97ccd](https://github.com/openwhyd/openwhyd/commit/4f97ccd)), closes [#224](https://github.com/openwhyd/openwhyd/issues/224) [/github.com/electron/electron/issues/2288#issuecomment-337858978](https://github.com//github.com/electron/electron/issues/2288/issues/issuecomment-337858978) [/github.com/openwhyd/openwhyd/issues/224#issuecomment-601430390](https://github.com//github.com/openwhyd/openwhyd/issues/224/issues/issuecomment-601430390)

## [1.30.1](https://github.com/openwhyd/openwhyd/compare/v1.30.0...v1.30.1) (2020-03-21)


### Bug Fixes

* **error:** 404 redirect when clicking load more on account stream ([#296](https://github.com/openwhyd/openwhyd/issues/296)) ([f6dfefe](https://github.com/openwhyd/openwhyd/commit/f6dfefe)), closes [#295](https://github.com/openwhyd/openwhyd/issues/295) [#299](https://github.com/openwhyd/openwhyd/issues/299)

# [1.30.0](https://github.com/openwhyd/openwhyd/compare/v1.29.0...v1.30.0) (2020-03-21)


### Features

* **ci:** separate ci tasks for each type of tests ([#298](https://github.com/openwhyd/openwhyd/issues/298)) ([d87ec4a](https://github.com/openwhyd/openwhyd/commit/d87ec4a)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

# [1.29.0](https://github.com/openwhyd/openwhyd/compare/v1.28.2...v1.29.0) (2020-03-21)


### Features

* **ci:** enable TypeScript in Cypress tests ([#297](https://github.com/openwhyd/openwhyd/issues/297)) ([929fc79](https://github.com/openwhyd/openwhyd/commit/929fc79)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.28.2](https://github.com/openwhyd/openwhyd/compare/v1.28.1...v1.28.2) (2020-03-14)


### Bug Fixes

* **ui:** never-ending loading animation on empty search ([#260](https://github.com/openwhyd/openwhyd/issues/260)) ([3c4cc85](https://github.com/openwhyd/openwhyd/commit/3c4cc85)), closes [#226](https://github.com/openwhyd/openwhyd/issues/226)

## [1.28.1](https://github.com/openwhyd/openwhyd/compare/v1.28.0...v1.28.1) (2020-03-14)


### Bug Fixes

* **deps:** bump acorn from 7.1.0 to 7.1.1 ([#292](https://github.com/openwhyd/openwhyd/issues/292)) ([2db3617](https://github.com/openwhyd/openwhyd/commit/2db3617))

# [1.28.0](https://github.com/openwhyd/openwhyd/compare/v1.27.7...v1.28.0) (2020-03-13)


### Features

* **tests:** migrate bookmarklet e2e test to Cypress ([#276](https://github.com/openwhyd/openwhyd/issues/276)) ([38fd0f6](https://github.com/openwhyd/openwhyd/commit/38fd0f6)), closes [#199](https://github.com/openwhyd/openwhyd/issues/199)

## [1.27.7](https://github.com/openwhyd/openwhyd/compare/v1.27.6...v1.27.7) (2020-03-13)


### Bug Fixes

* **bookmarklet:** refactor makeFileDetector() and make it more robust ([#287](https://github.com/openwhyd/openwhyd/issues/287)) ([c48c283](https://github.com/openwhyd/openwhyd/commit/c48c283))

## [1.27.6](https://github.com/openwhyd/openwhyd/compare/v1.27.5...v1.27.6) (2020-03-13)


### Bug Fixes

* **bookmarklet:** make "install" button more visible during onboarding ([#291](https://github.com/openwhyd/openwhyd/issues/291)) ([9a0c96d](https://github.com/openwhyd/openwhyd/commit/9a0c96d))

## [1.27.5](https://github.com/openwhyd/openwhyd/compare/v1.27.4...v1.27.5) (2020-03-13)


### Bug Fixes

* **#262:** announce improvements on home page ([#288](https://github.com/openwhyd/openwhyd/issues/288)) ([6eca49f](https://github.com/openwhyd/openwhyd/commit/6eca49f)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#262](https://github.com/openwhyd/openwhyd/issues/262)

## [1.27.4](https://github.com/openwhyd/openwhyd/compare/v1.27.3...v1.27.4) (2020-03-13)


### Bug Fixes

* **bookmarklet:** fix and homogenize wording, second pass ([#290](https://github.com/openwhyd/openwhyd/issues/290)) ([7895946](https://github.com/openwhyd/openwhyd/commit/7895946)), closes [#289](https://github.com/openwhyd/openwhyd/issues/289)

## [1.27.3](https://github.com/openwhyd/openwhyd/compare/v1.27.2...v1.27.3) (2020-03-13)


### Bug Fixes

* **ui:** simplify bookmarklet page and homogenize wording ([#289](https://github.com/openwhyd/openwhyd/issues/289)) ([c8b13f5](https://github.com/openwhyd/openwhyd/commit/c8b13f5))

## [1.27.2](https://github.com/openwhyd/openwhyd/compare/v1.27.1...v1.27.2) (2020-03-13)


### Bug Fixes

* **bookmarklet:** [refactor] move browser-only code to end ([#286](https://github.com/openwhyd/openwhyd/issues/286)) ([dd1c58b](https://github.com/openwhyd/openwhyd/commit/dd1c58b)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262)

## [1.27.1](https://github.com/openwhyd/openwhyd/compare/v1.27.0...v1.27.1) (2020-03-13)


### Bug Fixes

* **version:** bump bookmarklet version ([65eb02e](https://github.com/openwhyd/openwhyd/commit/65eb02e))

# [1.27.0](https://github.com/openwhyd/openwhyd/compare/v1.26.4...v1.27.0) (2020-03-13)


### Features

* **bookmarklet:** extract youtube track names from page ([#285](https://github.com/openwhyd/openwhyd/issues/285)) ([9493f06](https://github.com/openwhyd/openwhyd/commit/9493f06)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#281](https://github.com/openwhyd/openwhyd/issues/281) [#282](https://github.com/openwhyd/openwhyd/issues/282)

## [1.26.4](https://github.com/openwhyd/openwhyd/compare/v1.26.3...v1.26.4) (2020-03-12)


### Bug Fixes

* **youtube:** dedicated api key for development ([#284](https://github.com/openwhyd/openwhyd/issues/284)) ([b5e5b0f](https://github.com/openwhyd/openwhyd/commit/b5e5b0f))

## [1.26.3](https://github.com/openwhyd/openwhyd/compare/v1.26.2...v1.26.3) (2020-03-12)


### Bug Fixes

* **youtube:** regroup api keys in same project, for [#262](https://github.com/openwhyd/openwhyd/issues/262) ([#283](https://github.com/openwhyd/openwhyd/issues/283)) ([f401617](https://github.com/openwhyd/openwhyd/commit/f401617))

## [1.26.2](https://github.com/openwhyd/openwhyd/compare/v1.26.1...v1.26.2) (2020-03-12)


### Bug Fixes

* display playable bookmarklet hits first ([#282](https://github.com/openwhyd/openwhyd/issues/282)) ([4518d11](https://github.com/openwhyd/openwhyd/commit/4518d11))

## [1.26.1](https://github.com/openwhyd/openwhyd/compare/v1.26.0...v1.26.1) (2020-03-12)


### Bug Fixes

* **bookmarklet:** refactor bookmarklet and add tests for [#262](https://github.com/openwhyd/openwhyd/issues/262) ([#281](https://github.com/openwhyd/openwhyd/issues/281)) ([957afec](https://github.com/openwhyd/openwhyd/commit/957afec)), closes [#280](https://github.com/openwhyd/openwhyd/issues/280)

# [1.26.0](https://github.com/openwhyd/openwhyd/compare/v1.25.2...v1.26.0) (2020-03-12)


### Features

* **tests:** add unit tests for bookmarklet ([a75e84e](https://github.com/openwhyd/openwhyd/commit/a75e84e))

## [1.25.2](https://github.com/openwhyd/openwhyd/compare/v1.25.1...v1.25.2) (2020-03-11)


### Bug Fixes

* **#262:** bookmarklet to not fetch youtube metadata ([#279](https://github.com/openwhyd/openwhyd/issues/279)) ([6b11549](https://github.com/openwhyd/openwhyd/commit/6b11549)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#262](https://github.com/openwhyd/openwhyd/issues/262)

## [1.25.1](https://github.com/openwhyd/openwhyd/compare/v1.25.0...v1.25.1) (2020-03-11)


### Bug Fixes

* **#262:** disable external track search and filters (incl. YouTube) ([#278](https://github.com/openwhyd/openwhyd/issues/278)) ([e4c5472](https://github.com/openwhyd/openwhyd/commit/e4c5472)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#262](https://github.com/openwhyd/openwhyd/issues/262)

# [1.25.0](https://github.com/openwhyd/openwhyd/compare/v1.24.1...v1.25.0) (2020-03-11)


### Features

* **ui:** announcing issues with youtube api ([9327ecb](https://github.com/openwhyd/openwhyd/commit/9327ecb))

## [1.24.1](https://github.com/openwhyd/openwhyd/compare/v1.24.0...v1.24.1) (2020-03-11)


### Bug Fixes

* **#262:** dedicated yt api key for remote player iframe ([683a1c0](https://github.com/openwhyd/openwhyd/commit/683a1c0)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262)
* **#262:** dedicated yt api key to test local iframe ([ac807ec](https://github.com/openwhyd/openwhyd/commit/ac807ec)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262)
* **#262:** extend youtube api quota from bookmarklet ([#277](https://github.com/openwhyd/openwhyd/issues/277)) ([6668102](https://github.com/openwhyd/openwhyd/commit/6668102)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#262](https://github.com/openwhyd/openwhyd/issues/262)
* **ci:** disable bookmarklet that fails in headless mode ([436525e](https://github.com/openwhyd/openwhyd/commit/436525e))

# [1.24.0](https://github.com/openwhyd/openwhyd/compare/v1.23.0...v1.24.0) (2020-03-01)


### Features

* **ui:** restore the default sidebox announcement ([c4812de](https://github.com/openwhyd/openwhyd/commit/c4812de))

# [1.23.0](https://github.com/openwhyd/openwhyd/compare/v1.22.1...v1.23.0) (2020-03-01)


### Features

* **ci:** speed up docker image creation ([#275](https://github.com/openwhyd/openwhyd/issues/275)) ([80e7056](https://github.com/openwhyd/openwhyd/commit/80e7056))

## [1.22.1](https://github.com/openwhyd/openwhyd/compare/v1.22.0...v1.22.1) (2020-03-01)


### Bug Fixes

* **ci:** execution of Cypress test on GitHub Actions workflow ([#274](https://github.com/openwhyd/openwhyd/issues/274)) ([dc73eb2](https://github.com/openwhyd/openwhyd/commit/dc73eb2))

# [1.22.0](https://github.com/openwhyd/openwhyd/compare/v1.21.4...v1.22.0) (2020-03-01)


### Features

* **sideBox:** inform about YouTube issues ([#272](https://github.com/openwhyd/openwhyd/issues/272)) ([0341ea0](https://github.com/openwhyd/openwhyd/commit/0341ea0)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#266](https://github.com/openwhyd/openwhyd/issues/266)

## [1.21.4](https://github.com/openwhyd/openwhyd/compare/v1.21.3...v1.21.4) (2020-03-01)


### Bug Fixes

* **refact:** extract "sidebox" announcements into dedicated template ([#269](https://github.com/openwhyd/openwhyd/issues/269)) ([9dc5f33](https://github.com/openwhyd/openwhyd/commit/9dc5f33))

## [1.21.3](https://github.com/openwhyd/openwhyd/compare/v1.21.2...v1.21.3) (2020-03-01)


### Bug Fixes

* **#269:** invalid template caused crash when adding from bookmarklet ([#270](https://github.com/openwhyd/openwhyd/issues/270)) ([b8a6bb3](https://github.com/openwhyd/openwhyd/commit/b8a6bb3)), closes [#269](https://github.com/openwhyd/openwhyd/issues/269) [#269](https://github.com/openwhyd/openwhyd/issues/269) [/github.com/openwhyd/openwhyd/pull/263/files#diff-d04a3fa73a7dd2a179772cc75555275eR109](https://github.com//github.com/openwhyd/openwhyd/pull/263/files/issues/diff-d04a3fa73a7dd2a179772cc75555275eR109)

## [1.21.2](https://github.com/openwhyd/openwhyd/compare/v1.21.1...v1.21.2) (2020-03-01)


### Bug Fixes

* **#262:** specify dedicated YouTube API key for bookmarklet ([#267](https://github.com/openwhyd/openwhyd/issues/267)) ([ea87101](https://github.com/openwhyd/openwhyd/commit/ea87101)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [/github.com/openwhyd/openwhyd/issues/262#issuecomment-592952454](https://github.com//github.com/openwhyd/openwhyd/issues/262/issues/issuecomment-592952454)
* **#262:** specify dedicated YouTube API key for mainTemplate ([#271](https://github.com/openwhyd/openwhyd/issues/271)) ([2197d7f](https://github.com/openwhyd/openwhyd/commit/2197d7f)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262) [#262](https://github.com/openwhyd/openwhyd/issues/262)
* **#262:** specify dedicated YouTube API key for postEditV2 ([#268](https://github.com/openwhyd/openwhyd/issues/268)) ([7e88c95](https://github.com/openwhyd/openwhyd/commit/7e88c95)), closes [#262](https://github.com/openwhyd/openwhyd/issues/262)

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
