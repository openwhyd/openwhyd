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

async function getCleanedPageBody(cookieJar, path) {
  const { body } = await promisify(openwhyd.getRaw)(cookieJar, path);
  return body
    .replace(/src="(.*\.[a-z]{2,3})\?\d+\.\d+\.\d+"/g, 'src="$1"') // remove openwhyd version from paths to html resources, to reduce noise in diff
    .replace(/>\d+ (day|month|year)s?( ago)?/g, '>(age)'); // remove age of posts, because it depends on the time when tests are run
}

test.before(async (t) => {
  const users = await readMongoDocuments(__dirname + '/approval.users.json');
  const posts = await readMongoDocuments(__dirname + '/approval.posts.json');
  await insertTestData(MONGODB_URL, users, posts);
  await refreshOpenwhydCache();
  t.context.user = users[0];
});

const personaLabels = ['Visitor', 'User'];

personaLabels.forEach((persona) => {
  test(`${persona}, Home, page 1, HTML`, async (t) => {
    const { jar, loggedIn } =
      persona === 'Visitor'
        ? await promisify(openwhyd.logout)(null)
        : await promisify(openwhyd.loginAs)(t.context.user);
    if (persona === 'User') t.true(loggedIn);
    const body = await getCleanedPageBody(jar, '/');
    t.snapshot(body);
  });
});

test('Visitor, Profile, page 1, HTML', async (t) => {
  const body = await getCleanedPageBody(null, '/adrien');
  t.snapshot(body);
});

test('Visitor, Profile, page 2, HTML', async (t) => {
  const body = await getCleanedPageBody(
    null,
    '/adrien?after=600ec1c703e2014e630c8137'
  );
  t.snapshot(body);
});
