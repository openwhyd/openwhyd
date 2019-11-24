var { promisify } = require('util');
var assert = require('assert');
const request = promisify(require('request'));

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const logout = promisify(apiClient.logout);
const loginAs = promisify(apiClient.loginAs);
const signupAs = promisify(apiClient.signupAs);

describe('auth api', () => {
  describe('login with email', () => {
    it('succeeds', async () => {
      const { response, body } = await loginAs(ADMIN_USER);
      const cookies = ((response.headers || {})['set-cookie'] || []).join(' ');
      assert(/whydSid\=/.test(cookies));
      assert(JSON.parse(body).redirect);
    });

    it('gives access to personal /stream', async () => {
      const { jar } = await loginAs(ADMIN_USER);
      const response = await request({
        jar,
        url: URL_PREFIX + '/stream?format=json'
      });
      assert.equal(response.statusCode, 200);
      var json = JSON.parse(response.body);
      assert.ifError(json.error);
      assert(json.join); // check that it's an array
    });

    it('fails if wrong email', async () => {
      const { body } = await loginAs({ ...ADMIN_USER, email: 'qq' });
      assert(/email/.test(JSON.parse(body).error));
    });

    it('fails if wrong password', async () => {
      const { body } = await loginAs({ ...ADMIN_USER, md5: 'qq' });
      assert(JSON.parse(body).wrongPassword);
    });
  });

  describe('logout', () => {
    it('denies access to personal /stream', async () => {
      const { jar: loginJar } = await loginAs(ADMIN_USER);
      const { jar } = await logout(loginJar);
      const response = await request({
        jar,
        url: URL_PREFIX + '/stream?format=json'
      });
      assert(/login/.test(JSON.parse(response.body).error));
    });
  });

  //describe('forgot password', () => {); // TODO <= mock emails

  // Register / sign up a new user

  describe('signup', () => {
    it('gives access to personal /stream', async () => {
      const { jar, body } = await signupAs(TEST_USER);
      assert.ifError(body.error);
      const response = await request({
        jar,
        url: URL_PREFIX + '/stream?format=json'
      });
      assert.equal(response.statusCode, 200);
      const json = JSON.parse(response.body);
      assert.ifError(json.error);
      assert(json.join); // check that it's an array
    });
  });
});
