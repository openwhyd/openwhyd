const util = require('util');
const {
  readMongoDocuments,
  insertTestData,
} = require('../../approval-tests-helpers');
const mongodb = require(__dirname + '/../../../app/models/mongodb.js');
const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';
const { cleanup } = require('../../fixtures.js');

process.appParams = {
  urlPrefix: '',
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || mongodb.Connection.DEFAULT_PORT,
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'],
};

async function initMongoDb() {
  if (process.env['WITHOUT_CONSOLE_LOG'] == 'true') {
    console.log = () => {};
  } // In order to have nice console summary
  await util.promisify(mongodb.init)();
  await mongodb.initCollections();
}

async function insertUser(user) {
  await insertTestData(MONGODB_URL, { user: user });
  return user[0]._id;
}

module.exports = {
  initMongoDb,
  insertUser,
  readMongoDocuments,
  insertTestData,
  cleanup,
  mongodb,
};
