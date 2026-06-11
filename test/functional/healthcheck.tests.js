const express = require('express');
const test = require('ava');
const request = require('supertest');

process.appParams = { color: false };

const {
  attachHealthcheckRoute,
} = require('../../app/lib/my-http-wrapper/http/Application');

test('GET /healthcheck returns OK', async (t) => {
  const app = express();
  attachHealthcheckRoute(app);

  const response = await request(app).get('/healthcheck');

  t.is(response.status, 200);
  t.is(response.text, 'OK');
  t.regex(response.headers['content-type'], /^text\/plain/);
});
