var fs = require('fs');

var DB_INIT_SCRIPTS = [
  './config/initdb.js',
  './config/initdb_testing.js', // creates an admin user => should not be run on production!
];

exports.resetTestDb = async () => {
  process.appParams = {
    mongoDbHost: process.env['MONGODB_HOST'].substr(),
    mongoDbPort: process.env['MONGODB_PORT'].substr(), // 27017
    mongoDbAuthUser: process.env['MONGODB_USER'],
    mongoDbAuthPassword: process.env['MONGODB_PASS'],
    mongoDbDatabase: 'openwhyd_test', //process.env['MONGODB_DATABASE'],
  };
  console.log('[test-db-init.js] Connecting to db ...');
  const mongodb = require('../app/models/mongodb.js');
  const db = await new Promise((resolve, reject) =>
    mongodb.init((err, db) => (err ? reject(err) : resolve(db)))
  );
  console.log('[test-db-init.js] Clearing test database ...');
  await new Promise((resolve, reject) =>
    db.dropDatabase((err) => (err ? reject(err) : resolve()))
  );
  for await (const initScript of DB_INIT_SCRIPTS) {
    console.log(
      '[test-db-init.js] Applying db init script:',
      initScript,
      '...'
    );
    await new Promise((resolve) =>
      mongodb.runShellScript(fs.readFileSync(initScript), resolve)
    );
  }
  console.log('[test-db-init.js] => done.');
};
