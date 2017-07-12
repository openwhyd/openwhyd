# Openwhyd.org (formerly whyd.com) ![Travis-CI](https://travis-ci.org/openwhyd/openwhyd.svg?branch=master) [![OpenCollective](https://opencollective.com/openwhyd/backers/badge.svg)](#backers) [![OpenCollective](https://opencollective.com/openwhyd/sponsors/badge.svg)](#sponsors)

> Collect, play and share music from various streaming platforms

Openwhyd's curating platform (website + iphone app) allows music lovers to find and play very specific versions of songs that their love, and are not available on major music platforms such as Spotify or iTunes. E.g. rare remixes, DJ sets, bootlegs and epic live performances.

**You can use it on [openwhyd.org](https://openwhyd.org).**

[![Whyd Music Demo Video](./docs/openwhyd-demo-thumb.png)](https://www.youtube.com/watch?v=aZT8VlTV1YY "Whyd Music Demo Video")

Features:

- a bookmarklet / chrome extension for adding music tracks from the web (e.g. a Youtube page)
- add tracks to playlists, from heterogeneous streaming platforms
- social curation: users can subscribe/follow you, so that your latests tracks can be played from their stream
- you can add a description to each track
- supports music from youtube, soundcloud, vimeo, bandcamp, and MP3 files (as long as they are hosted on the web)

## Status of the project

This product is the result of years of iterative development, by the start-up company [Whyd](https://whyd.com). Read [the full story from Whyd to Openwhyd](https://medium.com/openwhyd/music-amongst-other-topics-a4f41657d6d).

Since [its code was generously open-sourced by Whyd](http://eprnews.com/whyd-the-music-streaming-social-network-becomes-openwhyd-and-gives-keys-to-the-community-18067/), [Adrien Joly](https://github.com/adrienjoly) (ex-lead developer at Whyd) has been maintaining it on his spare time (i.e. replying to user feedback on twitter and facebook, maintaing issues based on user feedback, backing up openwhyd's database, updating SSL certificates...), and coordinating [contributors](https://github.com/openwhyd/openwhyd/network/members).

We welcome contributors, including beginners!

- Latest stats, analytics and demographics: [Openwhyd data report, mid-october 2016](https://infograph.venngage.com/p/160097/openwhyd-data-report-mid-october-2016)
- A question / problem? --> Check out [our FAQ](https://github.com/openwhyd/openwhyd/blob/master/docs/FAQ.md)
- ... and don't forget to [like us on Facebook](https://facebook.com/openwhyd/), and [follow us on Twitter](https://twitter.com/open_whyd).

## Tech stack

- Node.js
- Express-like Web Server
- jQuery
- HTML + CSS
- [Playemjs](https://github.com/adrienjoly/playemjs) for streaming tracks continuously

## Contribute

If you want to contribute, please:

- read the contribution guidelines: [CONTRIBUTING.md](https://github.com/openwhyd/openwhyd/blob/master/CONTRIBUTING.md);
- pick an issue from [our roadmap](https://github.com/openwhyd/openwhyd/projects/1), work on it, then propose a Pull-Request;
- if you need help, [ask us on Slack](https://openwhyd-slack.herokuapp.com/).

Also, be aware that this project has become open-source very recently, so please be kind and constructive about code quality, and about the management of this project.

Thank you for your understanding! ^^

## Prerequisites
* Node.js
* MongoDB
* GraphicsMagick or ImageMagick
* `make` and `g++` (for building npm binaries, *I had to do [this](https://github.com/fedwiki/wiki/issues/46) and [this](https://www.digitalocean.com/community/questions/node-gyp-rebuild-fails-on-install)*)

## Setup (with Docker, for development environment)

* Instal Docker Client via https://www.docker.com/community-edition
* Build and Launch all processes `docker-compose up`
* Initialize MongoDB database (do it one-time only) : `docker-compose exec mongo mongo openwhyd_data data/initdb.js data/initdb_team.js && docker-compose restart web`
* Open [http://localhost:8080](http://localhost:8080) (or `WHYD_URL_PREFIX`)

* Then after first initialization, to launch all processes `docker-compose up`

## Setup (manual)
* Make sure that MongoDB is running
* Make sure that the necessary environment variables are defined (see below)
* Make sure that the database is initialized (by running `mongo openwhyd_data whydDB/initdb.js` and `mongo openwhyd_data initdb_team.js`, after updaing the `email` and `pwd` fields for the admin account)
* Make sure that dependencies are installed (`npm install`)
* Make sure that Apple Push Notification Service (APNS) certificates are copied in `/whydJS/config/apns` with the following filenames: `aps_dev.cert.pem`, `aps_dev.key.pem`, `aps_prod.cert.pem`, `aps_prod.key.pem`, and `Dev_Whyd.mobileprovision`. (you can test them using `test_apns.sh`)

## Usage
* `npm run run` (for development) or `npm start` (forever daemon)
* Open [http://localhost:8080](http://localhost:8080) (or `WHYD_URL_PREFIX`)

## Testing

Run unit tests only:

```bash
npm run test-unit
```

Run all tests, including acceptance tests (webdriver.io-based):

```bash
# reset the test database
mongo openwhyd_test --eval "db.dropDatabase();"
mongo openwhyd_test whydDB/initdb.js
mongo openwhyd_test whydDB/initdb_team.js
# prepare the test environment
cd whydJS
source env-vars-testing.sh
npm install --dev
# run the "whydJS" application server
npm run run --mongoDbDatabase openwhyd_test
# then run the tests in a separate terminal session
npm test
```

## Environment variables
* `WHYD_GENUINE_SIGNUP_SECRET` (mandatory. a secret key that is used to make sure that sign-ups are legit)
* `WHYD_SESSION_SECRET` (mandatory. a secret key used to sign session cookies)
* `WHYD_DEV_APNS_PASSPHRASE` (mandatory. the passphrase used to de-cypher APNS certificate and key, for iOS push notifications in DEV mode)
* `WHYD_APNS_PASSPHRASE` (mandatory. the passphrase used to de-cypher APNS certificate and key, for iOS push notifications in PRODUCTION mode)
* `WHYD_ADMIN_OBJECTID` (ObjectId of the user that can access to admin endpoints)
* `WHYD_ADMIN_NAME` (Full-text name of the user that can access to admin endpoints)
* `WHYD_ADMIN_EMAIL` (mandatory. Email address of the user that can access to admin endpoints)
* `WHYD_CONTACT_EMAIL` (mandatory. email for users to contact the site's team)
* `WHYD_CRASH_EMAIL` (mandatory when running with forever. email address of the site's administrator)
* `WHYD_URL_PREFIX` (default: `http://localhost:8080`)
* `WHYD_PORT` (default: `8080`)
* `WHYD_DEV` (default: `false`)
* `MONGODB_DATABASE` (example: `openwhyd_data`, or `openwhyd_test`)
* `MONGODB_HOST` (default: `localhost`)
* `MONGODB_PORT` (default: `27017`)
* `MONGODB_USER` (default: none)
* `MONGODB_PASS` (default: none)
* `SENDGRID_API_USER` (mandatory. email address of sendgrid account to be used for sending emails)
* `SENDGRID_API_KEY` (mandatory. key / password of sendgrid account)
* `SENDGRID_API_FROM_EMAIL` (mandatory. email address of email sender)
* `SENDGRID_API_FROM_NAME` (mandatory. name of email sender)
* `LAST_FM_API_KEY` (mandatory. for lastfm scrobbling)
* `LAST_FM_API_SECRET` (mandatory. for lastfm scrobbling)
* `ALGOLIA_APP_ID` (mandatory. for search index)
* `ALGOLIA_API_KEY` (mandatory. for search index)

## Backers
Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/openwhyd#backer)]

<a href="https://opencollective.com/openwhyd/backer/0/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/1/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/2/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/3/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/4/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/5/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/6/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/7/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/8/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/9/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/10/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/11/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/12/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/13/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/14/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/15/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/16/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/17/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/18/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/19/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/20/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/21/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/22/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/23/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/24/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/25/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/26/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/27/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/28/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/29/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/29/avatar.svg"></a>

## Sponsors
Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/openwhyd#sponsor)]

<a href="https://opencollective.com/openwhyd/sponsor/0/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/1/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/2/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/3/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/4/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/5/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/6/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/7/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/8/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/9/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/10/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/11/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/12/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/13/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/14/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/15/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/16/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/17/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/18/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/19/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/20/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/21/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/22/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/23/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/24/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/25/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/26/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/27/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/28/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/29/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/29/avatar.svg"></a>
