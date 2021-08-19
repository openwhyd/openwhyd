// Before running these tests, make sure that:
// - Openwhyd is running on port 8080 (`$ docker-compose up --build`)
// - Its database is empty but initialized

const test = require('ava');
const { promisify } = require('util');
const openwhyd = require('./api-client');
const {
  readMongoDocuments,
  insertTestData,
  refreshOpenwhydCache,
} = require('./db-helpers');

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

const getPage = promisify(openwhyd.getRaw);

test.before(async () => {
  const users = await readMongoDocuments(__dirname + '/approval.users.json');
  const posts = await readMongoDocuments(__dirname + '/approval.posts.json');
  await insertTestData(MONGODB_URL, users, posts);
  await refreshOpenwhydCache();
});

test('Visitor, Home, page 1, HTML', async (t) => {
  const { body } = await getPage(null, '/');
  t.snapshot(body);
});

test('Visitor, Profile, page 1, HTML', async (t) => {
  const { body } = await getPage(null, '/adrien');
  t.snapshot(body);
});

test('Visitor, Profile, page 2, HTML', async (t) => {
  const { body } = await getPage(
    null,
    '/adrien?after=600ec1c703e2014e630c8137'
  );
  t.snapshot(body);
});
