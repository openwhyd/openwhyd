//@ts-check

const fs = require('fs');
const util = require('util');
const mongodb = require('../app/models/mongodb.js');
const { ImageStorage } = require('../app/infrastructure/ImageStorage.js');

const { DEBUG } = process.env;

const DB_INIT_SCRIPTS = [
  './config/initdb.js',
  './config/initdb_testing.js', // creates an admin user => should not be run on production!
];

if (process.env['MONGODB_HOST'] === undefined)
  throw new Error(`missing env var: MONGODB_HOST`);
if (process.env['MONGODB_PORT'] === undefined)
  throw new Error(`missing env var: MONGODB_PORT`);

const dbCreds = {
  mongoDbHost: process.env['MONGODB_HOST'],
  mongoDbPort: process.env['MONGODB_PORT'], // 27017
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: 'openwhyd_test', //process.env['MONGODB_DATABASE'],
};

if (DEBUG) console.log('[test-db-init.js] Connecting to db ...');
mongodb.init(dbCreds, async (err, db) => {
  if (err) throw err;
  if (DEBUG) console.log('[test-db-init.js] Clearing test database ...');
  await db.dropDatabase({ writeConcern: { w: 'majority', fsync: true } }); // intends to prevent occasional `E11000 duplicate key error collection: openwhyd_test.user`
  for await (const initScript of DB_INIT_SCRIPTS) {
    if (DEBUG)
      console.log(`[test-db-init.js] Applying script: ${initScript} ...`);
    const script = await fs.promises.readFile(initScript);
    await mongodb.runShellScript(script);
  }
  // delete uploaded files
  await new ImageStorage()
    .deleteAllFiles()
    .catch((err) => console.warn(`[test-db-init.js] ${err.message}`));

  if (DEBUG) console.log('[test-db-init.js] => done.');
  process.exit();
});
