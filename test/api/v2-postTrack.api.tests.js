const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');

describe(`[v2] postTrack`, function () {
  let URL_PREFIX;

  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  before(async () => {
    await openwhyd.setup();
    URL_PREFIX = openwhyd.getURL();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async function () {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
  });

  it('should respond with a 401 status code when trying to add a track without token', async function () {
    const res = await fetch(`${URL_PREFIX}/api/v2/postTrack`, {
      method: 'POST',
    });
    expect(res.status).equals(401);
  });
});
