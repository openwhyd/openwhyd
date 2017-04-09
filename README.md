# Openwhyd.org (formerly whyd.com)

> Collect, play and share music from various streaming platforms

Openwhyd's curating platform (website + iphone app) allows music lovers to find and play very specific versions of songs that their love, and are not available on major music platforms such as Spotify or iTunes. E.g. rare remixes, DJ sets, bootlegs and epic live performances.

[![Whyd Music Demo Video](./docs/openwhyd-demo-thumb.png)](https://www.youtube.com/watch?v=aZT8VlTV1YY "Whyd Music Demo Video")

Features:

- a bookmarklet / chrome extension for adding music tracks from the web (e.g. a Youtube page)
- add tracks to playlists, from heterogeneous streaming platforms
- social curation: users can subscribe/follow you, so that your latests tracks can be played from their stream
- you can add a description to each track
- supports music from youtube, soundcloud, vimeo, bandcamp, and MP3 files (as long as they are hosted on the web)

**You can use it on [openwhyd.org](https://openwhyd.org).**

Latest stats, analytics and demographics: [Openwhyd data report, mid-october 2016](https://infograph.venngage.com/p/160097/openwhyd-data-report-mid-october-2016)

[Like us on Facebook](https://facebook.com/openwhyd/), and [follow us on Twitter](https://twitter.com/open_whyd).

## Status of the project

This product is the result of years of iterative development, by the start-up company [Whyd](https://whyd.com). Read [the full story from Whyd to Openwhyd](https://medium.com/openwhyd/music-amongst-other-topics-a4f41657d6d).

Since [its code was generously open-sourced by Whyd](http://eprnews.com/whyd-the-music-streaming-social-network-becomes-openwhyd-and-gives-keys-to-the-community-18067/), [Adrien Joly](https://github.com/adrienjoly) (ex-lead developer at Whyd) has been maintaining it on his spare time (i.e. backing up openwhyd's database, maintaing issues based on user feedback...), and coordinating contibutors.

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

## Setup
* Make sure that MongoDB is running
* Make sure that the necessary environment variables are defined (see below)
* Make sure that the database is initialized (provided scripts: `initDB` and  `initTeam`, after updaing the `email` and `pwd` fields for the admin account)
* Make sure that dependencies are installed (`npm install`)
* Make sure that Apple Push Notification Service (APNS) certificates are copied in `/whydJS/config/apns` with the following filenames: `aps_dev.cert.pem`, `aps_dev.key.pem`, `aps_prod.cert.pem`, `aps_prod.key.pem`, and `Dev_Whyd.mobileprovision`. (you can test them using `test_apns.sh`)

## Usage
* `npm run run` or `npm start` (forever daemon)
* Open [http://localhost:8080](http://localhost:8080) (or `WHYD_URL_PREFIX`)

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
* `WHYD_USE_GRAPHICS_MAGICK` (if set to `false`, imagemagick will be used instead of image manipulation)
* `MONGODB_DATABASE` (default: `openwhyd_data`)
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
