const test = require('ava');
const { promisify } = require('util');
const openwhyd = require('./api-client');

const getPage = promisify(openwhyd.getRaw);

test('HelloWorld component', async (t) => {
  const { body } = await getPage(null, '/');
  t.snapshot(body);
});
