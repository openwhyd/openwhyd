// @ts-check

const util = require('util');
const mongodb = require('../app/models/mongodb.js');

if (process.env['MONGODB_HOST'] === undefined)
  throw new Error(`missing env var: MONGODB_HOST`);

if (process.env['MONGODB_PORT'] === undefined)
  throw new Error(`missing env var: MONGODB_PORT`);

const dbCreds = {
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || '27117',
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'] || 'openwhyd_test',
};

exports.initMongoDb = async ({ silent } = { silent: false }) => {
  const consoleBackup = console.log;
  if (silent) {
    console.log = () => {
      /* prevent mongodb from adding noise to stdout */
    };
  }
  await util.promisify(mongodb.init)(dbCreds);
  await mongodb.initCollections();
  if (silent) {
    console.log = consoleBackup; // now that we're done with db init => re-enable logging to stdout
  }
  return mongodb;
};
