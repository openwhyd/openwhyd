const querystring = require('querystring');
const assert = require('assert');

const { DUMMY_USER, ADMIN_USER, cleanup } = require('../fixtures.js');
const api = require('../api-client.js');

const getAsUser = (user, url, params) =>
  new Promise((resolve, reject) => {
    api.loginAs(user, function (err, { jar }) {
      if (err) {
        reject(err);
      } else {
        const getParams = !params ? '' : `?${querystring.encode(params)}`;
        api.get(jar, url + getParams, (err, res) =>
          err ? reject(err) : resolve(res)
        );
      }
    });
  });

describe(`follow api`, () => {
  // API documentation: https://openwhyd.github.io/openwhyd/API.html

  before(cleanup); // to prevent side effects between tests

  before(function () {
    this.timeout(4000); // give 4 seconds for each test to pass
  });

  it(`allows a user to follow another user`, async () => {
    const { response, body } = await getAsUser(DUMMY_USER, '/api/follow', {
      action: 'insert',
      tId: ADMIN_USER.id,
    });
    console.log({ statusCode: response.statusCode, body });
    assert.strictEqual(response.statusCode, 200);
    // TODO: then, check in the db that the user was really followed
  });
});
