# Install instructions

## Run with Docker (simple)

Docker makes it easy and safe to install and start the two servers required for Openwhyd: the MongoDB database server, and the web/application server (formerly called _whydJS_).

### Prerequisites

All you need is:

- access to the shell (a.k.a. _terminal_);
- to have [Docker](https://www.docker.com/products/docker-desktop);
- and to have [Git](https://www.atlassian.com/git/tutorials/install-git) installed on your machine.

### Docker for Windows Home
Docker for Windows Home runs on a virtual box, so localhost may not work. For all the instructions below, if localhost is not working, replace it with your docker ip. You can find your docker ip with :
```sh
$ docker-machine ip                  
```
- in your web browser, http://localhost:8080 become http://your-docker-ip:8080
- replace localhost in the different scripts

### Clone and run

Commands to type in your shell:

```sh
$ git clone https://github.com/openwhyd/openwhyd.git
$ cd openwhyd
$ docker-compose up --build --detach  # will start openwhyd's web server and database in the background
$ open http://localhost:8080          # ... in your web browser => you should see Openwhyd's home page! 🎉
$ docker-compose down                 # when you're done: will stop openwhyd's web server and database
```

After making changes to the source code, don't forget to stop and re-start it using `docker-compose`.

### Run automated tests

Commands to run all automated tests against the Docker container:

```sh
$ docker-compose up --build --detach  # to have openwhyd's web server and database running in the background
$ npm install                         # will install the necessary test runners (webdriver/selenium)
$ npm run docker:test                 # will run the automated tests: unit and end-to-end
```

### Sample data

If you want to import some user data from openwhyd.org into your local/test database, you can use the following script:

```sh
$ npm run docker:seed               # will clear the database and create the admin user
$ node scripts/import-from-prod.js  # will import 21 posts from https://openwhyd.org/adrien
```

After that, you will be able to sign in as an administrator using the following credentials:

- username: `admin`
- password: `admin`

The data imported can be seen from http://localhost:8080/all

### Connect to the database

If you want to connect to the MongoDB database with the `mongo` shell using `docker-compose` container:

```sh
$ docker-compose exec mongo mongo mongodb://localhost:27117/openwhyd_test
```

---

## Deploy to a DigitalOcean instance

Read [How to deploy on DigitalOcean](./howto-deploy-on-digitalocean.md).

---

## Install and run manually (advanced)

If you don't want to use Docker (or can't), you can follow these instructions.

### Setup (advanced)

- Install Node.js, MongoDB, GraphicsMagick or ImageMagick
- Make sure that `make` and `g++` are installed (required for building npm binaries, _I had to do [this](https://github.com/fedwiki/wiki/issues/46) and [this](https://www.digitalocean.com/community/questions/node-gyp-rebuild-fails-on-install)_)
- Make sure that a MongoDB server is running
- Make sure that the necessary environment variables are defined (see below)
- Make sure that the database is initialized (by running `mongo openwhyd_data config/initdb.js` and `mongo openwhyd_data config/initdb_testing.js`)
- Make sure that dependencies are installed (`npm install`)
- If you want notifications to be pushed to your iPhone app, make sure that Apple Push Notification Service (APNS) certificates are copied to `/config/apns` with the following filenames: `aps_dev.cert.pem`, `aps_dev.key.pem`, `aps_prod.cert.pem`, `aps_prod.key.pem`, and `Dev_Whyd.mobileprovision`. (you can test them using `test_apns.sh`)

### Usage (advanced)

- Run `npm start`, or `npm run forever:start` (auto-restart daemon)
- Open [http://localhost:8080](http://localhost:8080) (or `WHYD_URL_PREFIX`)
- During development, you may have to restart the server to have your changes taken into account.

### Testing (advanced)

Run unit tests only:

```sh
$ npm run test-unit
```

Run all tests, including acceptance tests (webdriver.io-based):

```sh
# in a terminal session, start Openwhyd's application server
$ . ./env-vars-testing.sh && npm start
# in another terminal session, run the tests
$ npm test
```

---

## Configuration (advanced)

### Command-line arguments

Openwhyd's entry point (`app.js`) accepts two kinds of command-line arguments:

- toggles: `--no-color`, `--fakeEmail` and `--emailAdminsOnly`; (see `FLAGS` from `app.js` for an up-to-date list)
- overrides: any app-level configuration parameter can be set, e.g. `urlPrefix` can be set as `--urlPrefix <value>`. (see `process.appParams` from `app.js` for an up-to-date list)

### Advanced use cases

#### Test email digests

If you want to test email digests locally:

```sh
$ node app.js --emailAdminsOnly --digestInterval 5000 --digestImmediate true
```

#### Map localhost to a domain name

If you want to test Deezer Connect, you will need your server to be reachable through a domain name. Here's a way to achieve that:

1. Configure your Deezer app to allow connections from `http://local.openwhyd.org:8080`;
2. Add `local.openwhyd.org` to your `/private/etc/hosts` file;
3. Flush the corresponding cache: `$ dscacheutil -flushcache`;
4. Start Openwhyd with `$ npm start -- --urlPrefix http://local.openwhyd.org:8080`.

### Environment variables

- `WHYD_GENUINE_SIGNUP_SECRET` (mandatory. a secret key that is used to make sure that sign-ups are legit)
- `WHYD_SESSION_SECRET` (mandatory. a secret key used to sign session cookies)
- `WHYD_DEV_APNS_PASSPHRASE` (mandatory. the passphrase used to de-cypher APNS certificate and key, for iOS push notifications in DEV mode)
- `WHYD_APNS_PASSPHRASE` (mandatory. the passphrase used to de-cypher APNS certificate and key, for iOS push notifications in PRODUCTION mode)
- `WHYD_ADMIN_OBJECTID` (ObjectId of the user that can access to admin endpoints)
- `WHYD_ADMIN_NAME` (Full-text name of the user that can access to admin endpoints)
- `WHYD_ADMIN_EMAIL` (mandatory. Email address of the user that can access to admin endpoints)
- `WHYD_CONTACT_EMAIL` (mandatory. email for users to contact the site's team)
- `WHYD_URL_PREFIX` (default: `http://localhost:8080`)
- `WHYD_PORT` (default: `8080`)
- `MONGODB_DATABASE` (example: `openwhyd_data`, or `openwhyd_test`)
- `MONGODB_HOST` (default: `localhost`)
- `MONGODB_PORT` (default: `27017`)
- `MONGODB_USER` (default: none)
- `MONGODB_PASS` (default: none)
- `SENDGRID_API_USER` (mandatory. email address of sendgrid account to be used for sending emails)
- `SENDGRID_API_KEY` (mandatory. key / password of sendgrid account)
- `SENDGRID_API_FROM_EMAIL` (mandatory. email address of email sender)
- `SENDGRID_API_FROM_NAME` (mandatory. name of email sender)
- `LAST_FM_API_KEY` (mandatory. for lastfm scrobbling)
- `LAST_FM_API_SECRET` (mandatory. for lastfm scrobbling)
- `ALGOLIA_APP_ID` (mandatory. for search index)
- `ALGOLIA_API_KEY` (mandatory. for search index)

### Other variables to update

The value of following constants is required to connect to the corresponding APIs:

- `YOUTUBE_API_KEY`
- `SOUNDCLOUD_CLIENT_ID`
- `JAMENDO_CLIENT_ID`
- `DEEZER_APP_ID`
