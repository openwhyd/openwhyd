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
