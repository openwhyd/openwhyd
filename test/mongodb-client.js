// @ts-check

const util = require('util');
const mongodb = require('../app/models/mongodb.js');

const dbCreds = {
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || '27117',
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'] || 'openwhyd_test',
};

exports.initMongoDb = async () => {
  if (process.env['WITHOUT_CONSOLE_LOG'] == 'true') {
    console.log = () => {
      /* In order to have nice console summary */
    };
  }
  await util.promisify(mongodb.init)(dbCreds);
  await mongodb.initCollections();
  return mongodb;
};
