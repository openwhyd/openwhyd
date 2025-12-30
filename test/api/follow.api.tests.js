//@ts-check

const querystring = require('querystring');
const assert = require('assert');

const { DUMMY_USER, ADMIN_USER } = require('../fixtures.js');
const api = require('../api-client.js');
const { sortAndIndentAsJSON } = require('../approval-tests-helpers.js');
const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
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

describe(`follow api`, function () {
  // API documentation: https://openwhyd.github.io/openwhyd/API.html

  const openwhyd = new OpenwhydTestEnv({
    startWithEnv: process.env.START_WITH_ENV_FILE,
  });

  before(async () => {
    await openwhyd.setup();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
  });

  it(`allows a user to follow another user`, async function () {
    this.timeout(5000); // give 5 seconds for this test to pass

    const { response, body } = await getAsUser(DUMMY_USER, '/api/follow', {
      action: 'insert',
      tId: ADMIN_USER.id,
    });
    assert.strictEqual(response.statusCode, 200);

    // check in the db that the user was really followed
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
    assert.deepEqual(
      sortAndIndentAsJSON(actualSubscriptions),
      sortAndIndentAsJSON(expectedSubscriptions),
    );
  });

  it(`should handle invalid skip parameter without throwing MongoDB error`, async function () {
    this.timeout(5000);

    // Test with various invalid skip values that could cause MongoDB errors
    const invalidSkipValues = [
      '-9223372036854775808', // the actual error from production logs
      '-1',
      'NaN',
      'Infinity',
      '-Infinity',
      'invalid',
    ];

    for (const skipValue of invalidSkipValues) {
      const { response, body } = await getAsUser(DUMMY_USER, '/api/follow', {
        action: 'fetchFollowers',
        id: ADMIN_USER.id,
        skip: skipValue,
        limit: 10,
      });

      // Should return a successful response (200) with an array, not a MongoDB error
      assert.strictEqual(
        response.statusCode,
        200,
        `Failed for skip value: ${skipValue}`,
      );
      assert.ok(
        Array.isArray(body),
        `Expected array response for skip value: ${skipValue}`,
      );
    }
  });

  it(`should handle invalid limit parameter without throwing MongoDB error`, async function () {
    this.timeout(5000);

    const invalidLimitValues = ['-1', '0', 'NaN', 'Infinity', 'invalid'];

    for (const limitValue of invalidLimitValues) {
      const { response, body } = await getAsUser(DUMMY_USER, '/api/follow', {
        action: 'fetchFollowing',
        id: ADMIN_USER.id,
        skip: 0,
        limit: limitValue,
      });

      assert.strictEqual(
        response.statusCode,
        200,
        `Failed for limit value: ${limitValue}`,
      );
      assert.ok(
        Array.isArray(body),
        `Expected array response for limit value: ${limitValue}`,
      );
    }
  });
});
