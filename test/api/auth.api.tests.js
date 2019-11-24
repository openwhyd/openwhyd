var { promisify } = require('util');
var assert = require('assert');

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const get = promisify(apiClient.get);
const logout = promisify(apiClient.logout);
const loginAs = promisify(apiClient.loginAs);
const signupAs = promisify(apiClient.signupAs);
const getUser = promisify(apiClient.getUser);

describe('auth api', () => {
  describe('login with email', () => {
    it('succeeds', async () => {
      const { response, body } = await loginAs(ADMIN_USER);
      const cookies = ((response.headers || {})['set-cookie'] || []).join(' ');
      assert(/whydSid\=/.test(cookies));
      assert(body.redirect);
    });

    it('gives access to personal /stream', async () => {
      const { jar } = await loginAs(ADMIN_USER);
      const { response, body } = await get(jar, '/stream?format=json');
      assert.equal(response.statusCode, 200);
      assert.ifError(body.error);
      assert(body.join); // check that it's an array
    });

    it('fails if wrong email', async () => {
      const { body } = await loginAs({ ...ADMIN_USER, email: 'qq' });
      assert(/email/.test(body.error));
    });

    it('fails if wrong password', async () => {
      const { body } = await loginAs({ ...ADMIN_USER, md5: 'qq' });
      assert(body.wrongPassword);
    });
  });

  describe('logout', () => {
    it('denies access to personal /stream', async () => {
      const { jar: loginJar } = await loginAs(ADMIN_USER);
      const { jar } = await logout(loginJar);
      const { body } = await get(jar, '/stream?format=json');
      assert(/login/.test(body.error));
    });
  });

  //describe('forgot password', () => {); // TODO <= mock emails

  // Register / sign up a new user

  describe('signup', () => {
    it('gives access to personal /stream', async () => {
      const { jar, body: signupBody } = await signupAs(TEST_USER);
      assert.ifError(signupBody.error);
      const { response, body } = await get(jar, '/stream?format=json');
      assert.equal(response.statusCode, 200);
      assert.ifError(body.error);
      assert(body.join); // check that it's an array
    });
  });

  describe('with secure hash', () => {
    const secureUser = {
      name: 'secure user',
      email: 'secure-user@openwhyd.org',
      password: 'mySecurePassword'
    };

    it('can create account', async () => {
      const { jar, body } = await signupAs(secureUser);
      assert.ifError(body.error);
    });

    it('can login', async () => {
      const { jar, body } = await loginAs(secureUser); // no md5 is provided
      assert.ifError(body.error);
      assert(jar);
    });

    it('holds secure hash', async () => {
      const { jar } = await loginAs(secureUser);
      const { body } = await getUser(jar, {});
      assert.ifError(body.error);
      assert.assert(body.sha1);
    });
  });
});
