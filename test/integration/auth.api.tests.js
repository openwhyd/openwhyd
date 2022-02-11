var { promisify } = require('util');
var assert = require('assert');

var { ADMIN_USER, TEST_USER, cleanup } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const get = promisify(apiClient.get);
const logout = promisify(apiClient.logout);
const loginAs = promisify(apiClient.loginAs);
const signupAs = promisify(apiClient.signupAs);
const getUser = promisify(apiClient.getUser);

const genSecureUser = (() => {
  let globalNumber = 0;
  return (number = ++globalNumber) => ({
    name: `secure user ${number}`,
    email: `secure-user-${number}@openwhyd.org`,
    password: `mySecurePassword${number}`,
  });
})();

before(cleanup);

describe('auth api', () => {
  describe('login with email', () => {
    it('succeeds', async () => {
      const { response, body } = await loginAs(ADMIN_USER);
      const cookies = ((response.headers || {})['set-cookie'] || []).join(' ');
      assert(/whydSid=/.test(cookies));
      assert(body.redirect);
    });

    it('access to personal /stream requires login', async () => {
      const { body } = await get({}, '/stream?format=json');
      assert.equal(body.error, 'Please login first');
    });

    it('gives access to profile', async () => {
      const { jar } = await loginAs(ADMIN_USER);
      const { response, body, error } = await get(jar, '/me?format=json');
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
    it('gives access to profile', async () => {
      const { jar, body: signupBody } = await signupAs(TEST_USER);
      assert.ifError(signupBody.error);
      const { response, body } = await get(jar, '/me?format=json');
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

    it('gives access to profile', async () => {
      const { jar } = await signupAs(genSecureUser());
      const { body } = await get(jar, '/me?format=json');
      assert.ifError(body.error);
    });

    it.skip('login with secure hash', async () => {
      const secureUser = genSecureUser();
      await signupAs(secureUser);
      const { jar, body } = await loginAs(secureUser);
      assert.ifError(body.error);
      assert(jar);
    });

    it('stores secure hash in db', async function () {
      const { jar } = await signupAs(genSecureUser());
      const { body } = await getUser(jar, {});
      assert.ifError(body.error);
      assert.equal(typeof body.arPwd, 'string');
      assert.notEqual(body.arPwd.length, 0);
    });
  });
});
