/* global describe, it, before */

const { promisify } = require('util');
const assert = require('assert');

const { ADMIN_USER, cleanup, URL_PREFIX } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const postRaw = promisify(apiClient.postRaw);
const loginAs = promisify(apiClient.loginAs);

before(cleanup);

describe('security', () => {
  describe('Open Redirect', () => {
    it('should redirect to /stream', async () => {
      const target = `/stream`;
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: target,
      });
      console.log('response.headers', response.headers);
      assert.equal(response.statusCode, 302);
      assert.equal(response.headers.location, target);
    });

    it(`should redirect to ${URL_PREFIX}/stream`, async () => {
      const target = `${URL_PREFIX}/stream`;
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: target,
      });
      console.log('response.headers', response.headers);
      assert.equal(response.statusCode, 302);
      assert.equal(response.headers.location, target);
    });

    it('should NOT redirect to other domain', async () => {
      const target = `http://google.com`;
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: target,
      });
      console.log('response.headers', response.headers);
      assert.equal(response.statusCode, 403);
      assert.notEqual(response.headers.location, target);
    });
  });
});
