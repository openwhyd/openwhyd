/* global describe, it, before */

const { promisify } = require('util');
const assert = require('assert');

const { ADMIN_USER, cleanup, URL_PREFIX } = require('../fixtures.js');
const apiClient = require('../api-client.js');

const postRaw = promisify(apiClient.postRaw);
const loginAs = promisify(apiClient.loginAs);

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
      assert(
        response.body.includes(`window.location.href="${target}"`) === true,
        `page body should include redirect to ${target}`
      );
    });

    it('should NOT allow redirect to other domain', async () => {
      const target = `https://google.com`;
      const { response } = await postRaw(null, `/login`, {
        action: 'login',
        email: ADMIN_USER.email,
        md5: ADMIN_USER.md5,
        redirect: target,
      });
      assert(
        response.body.includes(`window.location.href="${target}"`) === false,
        `page body should NOT include redirect to ${target}`
      );
    });

    it('should NOT allow javascript in redirect URL', async () => {
      const target = `javascript:alert()`;
      const { response } = await postRaw(null, `/login`, {
        action: 'login',
        email: ADMIN_USER.email,
        md5: ADMIN_USER.md5,
        redirect: target,
      });
      assert(
        response.body.includes(`window.location.href="${target}"`) === false,
        `page body should NOT include redirect to ${target}`
      );
    });

    it('should NOT allow script element in redirect URL', async () => {
      const target = `<script>alert(document.cookie)</script>`;
      const { response } = await postRaw(null, `/login`, {
        action: 'login',
        email: ADMIN_USER.email,
        md5: ADMIN_USER.md5,
        redirect: target,
      });
      assert(
        response.body.includes(`window.location.href="${target}"`) === false,
        `page body should NOT include redirect to ${target}`
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
