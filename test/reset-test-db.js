var fs = require('fs');
var async = require('async');
var mongodbWrapper = require('../app/models/mongodb.js');

//var DB_INIT_SCRIPT = './config/initdb_team.js'; // creates an admin user => should not be run on production!

var DB_INIT_SCRIPTS = [
  './config/initdb.js',
  './config/initdb_team.js' // creates an admin user => should not be run on production!
];

var params = (process.appParams = {
  mongoDbHost: process.env['MONGODB_HOST'].substr(),
  mongoDbPort: process.env['MONGODB_PORT'].substr(), // 27017
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: 'openwhyd_test' //process.env['MONGODB_DATABASE'],
});

console.log('[test-db-init.js] Connecting to db ...');
mongodbWrapper.init().then(db => {
  console.log('[test-db-init.js] Clearing test database ...');
  db.dropDatabase(function(err) {
    if (err) throw err;
    /*
    console.log('[test-db-init.js] Applying db init script:', DB_INIT_SCRIPT, '...');
    mongodb.runShellScript(fs.readFileSync(DB_INIT_SCRIPT), function(err) {
      if (err) throw err;
      console.log('[test-db-init.js] => done.');
      process.exit();
    });
    */
    async.eachSeries(
      DB_INIT_SCRIPTS,
      function(initScript, nextScript) {
        console.log(
          '[test-db-init.js] Applying db init script:',
          initScript,
          '...'
        );
        mongodbWrapper.runShellScript(fs.readFileSync(initScript), nextScript);
      },
      function(err, res) {
        if (err) throw err;
        console.log('[test-db-init.js] => done.');
        process.exit();
      }
    );
  });
});
