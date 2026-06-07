// @ts-check

const assert = require('assert');
const request = require('supertest');

process.appParams = { color: false };

const {
  Application,
} = require('../../app/lib/my-http-wrapper/http/Application.js');

describe('healthcheck endpoint', () => {
  it('responds before the legacy middleware stack', async () => {
    const appServer = new Application({
      appDir: `${__dirname}/../fixtures/healthcheck-app`,
      port: 0,
      features: {},
      uploadSettings: {},
      sessionMiddleware: (_req, _res, _next) => {
        throw new Error('healthcheck should not require session middleware');
      },
    });

    const response = await request(appServer.getExpressApp())
      .get('/healthcheck')
      .expect(200)
      .expect('Content-Type', /text\/plain/);

    assert.equal(response.text, 'OK');
  });
});
