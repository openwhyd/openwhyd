//@ts-check

const querystring = require('querystring');
const assert = require('assert');

const { DUMMY_USER, ADMIN_USER, cleanup } = require('../fixtures.js');
const api = require('../api-client.js');
const { dumpMongoCollection } = require('../approval-tests-helpers.js');
const { ObjectId } = require('../../app/models/mongodb.js');
const { START_WITH_ENV_FILE } = process.env;
const { startOpenwhydServer } = require('../approval-tests-helpers');

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

  /** @type { Awaited<ReturnType<startOpenwhydServer>>} */
  let serverProcess;

  before(cleanup); // to prevent side effects between tests

  before(async () => {
    if (START_WITH_ENV_FILE) {
      serverProcess = await startOpenwhydServer({
        startWithEnv: START_WITH_ENV_FILE,
      });
    }
  });

  after(async () => {
    if ('exit' in serverProcess) await serverProcess?.exit();
  });

  it(`allows a user to follow another user`, async function () {
    this.timeout(5000); // give 5 seconds for this test to pass

    const { response, body } = await getAsUser(DUMMY_USER, '/api/follow', {
      action: 'insert',
      tId: ADMIN_USER.id,
    });
    assert.strictEqual(response.statusCode, 200);

    // check in the db that the user was really followed
    const actualSubscriptions = await dumpMongoCollection(
      ('env' in serverProcess ? serverProcess.env : process.env).MONGODB_URL,
      'follow',
    );
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
