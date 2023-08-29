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
});
