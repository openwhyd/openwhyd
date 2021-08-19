const test = require('ava');
const { promisify } = require('util');
const openwhyd = require('./api-client');

const getPage = promisify(openwhyd.getRaw);

// Before running these tests, make sure that:
// - Openwhyd is running on port 8080 (`$ docker-compose up --build`)
// - Adrien's profile was imported locally (`$ node scripts/import-from-prod.js adrien`)

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
    '/adrien?after=600ec1c703e2014e630c8137' // TODO: include test data in test instead of importing tracks from production , to prevent tests from breaking after tracks are added on adrien's profile
  );
  t.snapshot(body);
});
