const { promisify } = require('util');
const assert = require('assert');

const { OpenwhydTestEnv } = require('../OpenwhydTestEnv.js');
const { ADMIN_USER, TEST_USER } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const get = promisify(apiClient.get);
const logout = promisify(apiClient.logout);
const loginAs = promisify(apiClient.loginAs);
const signupAs = promisify(apiClient.signupAs);

const genSecureUser = (() => {
  let globalNumber = 0;
  return (number = ++globalNumber) => ({
    name: `secure user ${number}`,
    email: `secure-user-${number}@openwhyd.org`,
    password: `mySecurePassword${number}`,
  });
})();

describe('auth api', function () {
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

  describe('login with email', () => {
    it('succeeds', async () => {
      const { response, body } = await loginAs(ADMIN_USER);
      const cookies = ((response.headers || {})['set-cookie'] || []).join(' ');
      assert(/whydSid=/.test(cookies)); // legacy auth/session
      assert(body.redirect);
    });

    it('access to personal /stream requires login', async () => {
      const { body } = await get({}, '/stream?format=json');
      assert.equal(body.error, 'Please login first');
    });

    it('gives access to personal /stream', async () => {
      const { jar } = await loginAs(ADMIN_USER);
      const { response, body, error } = await get(jar, '/stream?format=json');
      assert.ifError(error);
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

  describe('signup with md5', () => {
    it('gives access to personal /stream', async () => {
      const { jar, body: signupBody } = await signupAs(TEST_USER);
      assert.ifError(signupBody.error);
      const { response, body, error } = await get(jar, '/stream?format=json');
      assert.ifError(error);
      assert.equal(response.statusCode, 200);
      assert.ifError(body.error);
      assert(body.join); // check that it's an array
    });

    it('fails if password is missing', async () => {
      const userWithMissingPwd = {
        ...TEST_USER,
        pwd: '',
        password: '',
        md5: '',
      };
      const { jar, body: signupBody } = await signupAs(userWithMissingPwd);
      assert.equal(signupBody.error, 'Please enter a password');
      const { body } = await get(jar, '/stream?format=json');
      assert.equal(body.error, 'Please login first');
    });
  });

  describe('signup with secure hash', () => {
    it('succeeds', async () => {
      const { body } = await signupAs(genSecureUser());
      assert.ifError(body.error);
    });

    it('gives access to personal /stream', async () => {
      const { jar } = await signupAs(genSecureUser());
      const { body, error } = await get(jar, '/stream?format=json');
      assert.ifError(error);
      assert.ifError(body.error);
    });

    it.skip('login with secure hash', async () => {
      const secureUser = genSecureUser();
      await signupAs(secureUser);
      const { jar, body } = await loginAs(secureUser);
      assert.ifError(body.error);
      assert(jar);
    });
  });
});
