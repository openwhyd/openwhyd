// @ts-check

const {
  readMongoDocuments,
  insertTestData,
} = require('../../approval-tests-helpers');

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

const { cleanup } = require('../../fixtures.js');

async function insertUser(user) {
  await insertTestData(MONGODB_URL, { user: user });
  return user[0]._id;
}

module.exports = {
  insertUser,
  readMongoDocuments,
  insertTestData,
  cleanup,
};
