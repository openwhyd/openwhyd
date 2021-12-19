/* global describe, it, before */

const { promisify } = require('util');
const assert = require('assert');

const { ADMIN_USER, cleanup, URL_PREFIX } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const postRaw = promisify(apiClient.postRaw);
const loginAs = promisify(apiClient.loginAs);
const apiGet = promisify(apiClient.get);

before(cleanup);

describe('security', () => {
  describe('Open Redirect from /login', () => {
    it('should allow redirect to /stream', async () => {
      const target = `/stream`;
      const { response } = await postRaw(null, `/login`, {
        action: 'login',
        email: ADMIN_USER.email,
        md5: ADMIN_USER.md5,
        redirect: target,
      });
      assert.match(
        response.body,
        new RegExp(`<script>window.location.href="${target}";</script>`)
      );
    });
  });

  describe('Open Redirect from /consent', () => {
    it('should allow redirect to /stream', async () => {
      const target = `/stream`;
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: target,
      });
      assert.equal(response.statusCode, 302);
      assert.equal(response.headers.location, target);
    });

    it(`should allow redirect to ${URL_PREFIX}/stream`, async () => {
      const target = `${URL_PREFIX}/stream`;
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: target,
      });
      assert.equal(response.statusCode, 302);
      assert.equal(response.headers.location, target);
    });

    it('should NOT allow redirect to other domain', async () => {
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: `http://google.com`,
      });
      assert.equal(response.statusCode, 403); // forbidden
    });

    it('should NOT allow redirect to a disguised domain', async () => {
      const { jar } = await loginAs(ADMIN_USER);
      const { response } = await postRaw(jar, `/consent`, {
        lang: 'en',
        redirect: `${URL_PREFIX}@google.com`,
      });
      assert.equal(response.statusCode, 403); // forbidden
    });
  });
});
