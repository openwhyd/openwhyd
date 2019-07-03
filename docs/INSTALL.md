# Install instructions

### Setup (simple)

Docker makes it easy and safe to install and start the two servers required for Openwhyd: the MongoDB database server, and the web/application server (formerly called *whydJS*). All you need is access to the shell (a.k.a. *terminal*), and to have Docker and Git installed on your machine.

1. Install [Docker Client](https://www.docker.com/community-edition) and start it
2. [Install Git](https://www.atlassian.com/git/tutorials/install-git) if you don't have it already
3. Clone openwhyd's repository: `git clone https://github.com/openwhyd/openwhyd.git`, then `cd openwhyd`
4. Build and launch Docker processes: `docker-compose up`
6. Open [http://localhost:8080](http://localhost:8080) in your web browser => you should see Openwhyd's home page! 🎉
7. When you're done, shutdown the Docker processes by pressing the `Ctrl-C` key combination in the shell instance where you had run `docker-compose up` (step 4).

Whenever you want to update your local clone of Openwhyd's repository to the latest version, run `git pull` from the `openwhyd` folder where you had cloned the repository (step 3).

Whenever you want to start the Docker processes after shutting them down (step 7), run `docker-compose up` again from the `openwhyd` folder where you had cloned the repository (step 3).

Whenever you just want to restart Openwhyd while the Docker processes are still running, run `docker-compose restart web` from a shell terminal.

Whenever you want to know what Docker processes are currently running: run `docker-compose ps`.

If you want to rebuild the Docker image and run it in the background, use `docker-compose up -d --build --force-recreate`.

### Setup (manual)

* Install Node.js, MongoDB, GraphicsMagick or ImageMagick
* Make sure that `make` and `g++` are installed (required for building npm binaries, *I had to do [this](https://github.com/fedwiki/wiki/issues/46) and [this](https://www.digitalocean.com/community/questions/node-gyp-rebuild-fails-on-install)*)
* Make sure that a MongoDB server is running
* Make sure that the necessary environment variables are defined (see below)
* Make sure that the database is initialized (by running `mongo openwhyd_data config/initdb.js` and `mongo openwhyd_data config/initdb_team.js`)
* Make sure that dependencies are installed (`npm install`)
* If you want notifications to be pushed to your iPhone app, make sure that Apple Push Notification Service (APNS) certificates are copied to `/config/apns` with the following filenames: `aps_dev.cert.pem`, `aps_dev.key.pem`, `aps_prod.cert.pem`, `aps_prod.key.pem`, and `Dev_Whyd.mobileprovision`. (you can test them using `test_apns.sh`)

### Usage

* `docker-compose up`, or `npm run run`, or `npm forever:start` (auto-restart daemon)
* Open [http://localhost:8080](http://localhost:8080) (or `WHYD_URL_PREFIX`)
* During development, you may have to restart the server to have your changes taken into account. To restart the Docker container, use `docker-compose restart web`.

### Testing

Run unit tests only:

```bash
npm run test-unit
```

Run all tests, including acceptance tests (webdriver.io-based):

```bash
# in a terminal session, start Openwhyd's application server
npm run run-for-tests
# in another terminal session, run the tests
npm test
```

Run all tests against the Docker container:

```bash
npm run test-docker
```

### Environment variables

* `WHYD_GENUINE_SIGNUP_SECRET` (mandatory. a secret key that is used to make sure that sign-ups are legit)
* `WHYD_SESSION_SECRET` (mandatory. a secret key used to sign session cookies)
* `WHYD_DEV_APNS_PASSPHRASE` (mandatory. the passphrase used to de-cypher APNS certificate and key, for iOS push notifications in DEV mode)
* `WHYD_APNS_PASSPHRASE` (mandatory. the passphrase used to de-cypher APNS certificate and key, for iOS push notifications in PRODUCTION mode)
* `WHYD_ADMIN_OBJECTID` (ObjectId of the user that can access to admin endpoints)
* `WHYD_ADMIN_NAME` (Full-text name of the user that can access to admin endpoints)
* `WHYD_ADMIN_EMAIL` (mandatory. Email address of the user that can access to admin endpoints)
* `WHYD_CONTACT_EMAIL` (mandatory. email for users to contact the site's team)
* `WHYD_URL_PREFIX` (default: `http://localhost:8080`)
* `WHYD_PORT` (default: `8080`)
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

### Other variables to update

The value of following constants is required to connect to the corresponding APIs:

* `YOUTUBE_API_KEY`
* `SOUNDCLOUD_CLIENT_ID`
* `JAMENDO_CLIENT_ID`
* `DEEZER_APP_ID`
