const assert = require('assert');
const util = require('util');

const { OpenwhydTestEnv } = require('../approval-tests-helpers.js');
const { cleanup } = require('../fixtures.js');
const api = require('../api-client.js');

describe('base api', function () {
  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  before(cleanup.bind(this, { silent: true })); // to prevent side effects between tests

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  it("should return a 404 for URLs that don't exist", async () => {
    const { response } = await util.promisify(api.getRaw)(
      null,
      '//wp-content/dropdown.php',
    );
    assert.equal(response.statusCode, 404);
  });
});
