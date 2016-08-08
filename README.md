# OpenWhyd.org (formerly whyd.com) [![Build Status](https://travis-ci.org/openwhyd/openwhyd.svg?branch=master)](https://travis-ci.org/openwhyd/openwhyd) [![Code Climate](https://codeclimate.com/github/openwhyd/openwhyd/badges/gpa.svg)](https://codeclimate.com/github/openwhyd/openwhyd)

An awesome web platform for collecting, playing and sharing music from various streaming platforms.

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
