//@ts-check

const querystring = require('querystring');
const assert = require('assert');

const { DUMMY_USER, ADMIN_USER, cleanup } = require('../fixtures.js');
const api = require('../api-client.js');
const { OpenwhydTestEnv } = require('../approval-tests-helpers.js');
const { ObjectId } = require('../../app/models/mongodb.js');

const getAsUser = (user, url, params) =>
  new Promise((resolve, reject) => {
    api.loginAs(user, function (err, { jar }) {
      if (err) {
        reject(err);
      } else {
        const getParams = !params ? '' : `?${querystring.encode(params)}`;
        api.get(jar, url + getParams, (err, res) =>
          err ? reject(err) : resolve(res),
        );
      }
    });
  });

describe(`follow api`, () => {
  // API documentation: https://openwhyd.github.io/openwhyd/API.html

  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  before(cleanup); // to prevent side effects between tests

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  it(`allows a user to follow another user`, async function () {
    this.timeout(5000); // give 5 seconds for this test to pass

    const { response, body } = await getAsUser(DUMMY_USER, '/api/follow', {
      action: 'insert',
      tId: ADMIN_USER.id,
    });
    assert.strictEqual(response.statusCode, 200);

    // check in the db that the user was really followed
    const env = openwhyd.getEnv();
    console.warn('test is connecting to ', { MONGODB_URL: env.MONGODB_URL });
    const actualSubscriptions = await openwhyd.dumpCollection('follow');
    const expectedSubscriptions = [
      {
        _id: ObjectId(body._id),
        uId: DUMMY_USER.id,
        uNm: DUMMY_USER.name,
        tId: ADMIN_USER.id,
        tNm: ADMIN_USER.name,
      },
    ];
    assert.deepStrictEqual(actualSubscriptions, expectedSubscriptions);
  });
});
