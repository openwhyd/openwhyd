//@ts-check

const fs = require('fs');
const async = require('async');

const DB_INIT_SCRIPTS = [
  './config/initdb.js',
  './config/initdb_testing.js', // creates an admin user => should not be run on production!
];

if (process.env['WITHOUT_CONSOLE_LOG'] == 'true') {
  console.log = () => {
    /* In order to have nice console summary */
  };
}

// TODO: we should not rely on env vars in this file
if (process.env['MONGODB_HOST'] === undefined)
  throw new Error(`missing env var: MONGODB_HOST`);
if (process.env['MONGODB_PORT'] === undefined)
  throw new Error(`missing env var: MONGODB_PORT`);

/** @type {import('../app/models/mongodb').DbCreds} */
const dbCreds = {
  mongoDbHost: process.env['MONGODB_HOST'],
  mongoDbPort: process.env['MONGODB_PORT'], // 27017
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: 'openwhyd_test', //process.env['MONGODB_DATABASE'],
};

console.log('[test-db-init.js] Connecting to db ...');
require('../app/models/mongodb.js').init(dbCreds, function (err, db) {
  if (err) throw err;
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const mongodb = this;
  console.log('[test-db-init.js] Clearing test database ...');
  db.dropDatabase(function (err) {
    if (err) throw err;
    async.eachSeries(
      DB_INIT_SCRIPTS,
      function (initScript, nextScript) {
        console.log(
          '[test-db-init.js] Applying db init script:',
          initScript,
          '...',
        );
        mongodb.runShellScript(fs.readFileSync(initScript), nextScript);
      },
      function (err) {
        if (err) throw err;
        console.log('[test-db-init.js] => done.');
        process.exit();
      },
    );
  });
});
