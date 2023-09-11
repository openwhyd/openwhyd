// @ts-check

// Run with: $ START_WITH_ENV_FILE='./env-vars-testing.conf' npx --yes mocha test/api/hot-tracks.api.tests.js

const assert = require('assert');
const { httpClient, ObjectId } = require('../approval-tests-helpers');
const { OpenwhydTestEnv } = require('../OpenwhydTestEnv');

const {
  START_WITH_ENV_FILE,
  PORT, // Note: if PORT is not provided, approval-tests-helpers will start Openwhyd's server programmatically, using START_WITH_ENV_FILE
} = process.env;

const openwhyd = new OpenwhydTestEnv({
  startWithEnv: START_WITH_ENV_FILE,
  port: PORT,
});

const aLongTimeAgo = '000000000000000000000001';

const popularPost = {
  _id: ObjectId('61e19a3f078b4c9934e72ce5'),
  eId: '/yt/track_B',
  name: 'a popular track',
  nbR: 2,
};

const otherPost = {
  _id: ObjectId('61e19a3f078b4c9934e72ce4'),
  eId: '/yt/track_A',
  name: 'a regular track',
  nbR: 1,
};

describe('Hot Tracks', () => {
  /** @type import('mongodb').Db */
  let db;

  before(async () => {
    await openwhyd.setup();
    db = openwhyd.getMongoClient().db();
  });

  after(async () => {
    await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
  });

  it('returns the requested number of posts', async () => {
    await db.collection('post').insertMany([popularPost, otherPost]);
    const response = await httpClient
      .get({
        url: `${openwhyd.getURL()}/hot?sinceId=${aLongTimeAgo}&format=json&limit=1`,
      })
      .then(({ body }) => JSON.parse(body));
    assert.equal(response.tracks.length, 1);
  });

  it('returns posts starting at the requested index', async () => {
    await db.collection('post').insertMany([popularPost, otherPost]);
    const response = await httpClient
      .get({
        url: `${openwhyd.getURL()}/hot?sinceId=${aLongTimeAgo}&format=json&skip=1`,
      })
      .then(({ body }) => JSON.parse(body));
    assert.equal(response.tracks.length, 1);
    assert.equal(response.tracks[0].name, otherPost.name);
  });

  it('excludes posts outside of the requested temporal window', async () => {
    await db.collection('post').insertMany([popularPost, otherPost]);
    const response = await httpClient
      .get({
        url: `${openwhyd.getURL()}/hot?sinceId=${popularPost._id.toString()}&format=json`,
      })
      .then(({ body }) => JSON.parse(body));
    assert.equal(response.tracks.length, 1);
    assert.equal(response.tracks[0].name, popularPost.name); // because popularPost was posted later than otherPost
  });

  it('returns posts by descending number of reposts', async () => {
    await db.collection('post').insertMany([otherPost, popularPost]);
    const response = await httpClient
      .get({
        url: `${openwhyd.getURL()}/hot?sinceId=${aLongTimeAgo}&format=json`,
      })
      .then(({ body }) => JSON.parse(body));
    assert.equal(response.tracks[0].name, popularPost.name);
    assert.equal(response.tracks[1].name, otherPost.name);
  });

  it('returns just one track even if it was posted by two users', async () => {
    await db.collection('post').insertMany([
      { ...popularPost, uId: 'user1' },
      {
        ...popularPost,
        uId: 'user2',
        _id: ObjectId('61e19a3f078b4c9934e72ce6'), // posted after popularPost
      },
    ]);
    const response = await httpClient
      .get({
        url: `${openwhyd.getURL()}/hot?sinceId=${aLongTimeAgo}&format=json`,
      })
      .then(({ body }) => JSON.parse(body));
    assert.equal(response.tracks.length, 1);
  });

  it('returns information about the first user who posted each track', async () => {
    await db.collection('post').insertMany([
      {
        ...popularPost,
        uId: 'late_poster',
        _id: ObjectId('61e19a3f078b4c9934e72ce6'), // posted after popularPost
      },
      { ...popularPost, uId: 'first_poster' },
    ]);
    const response = await httpClient
      .get({
        url: `${openwhyd.getURL()}/hot?sinceId=${aLongTimeAgo}&format=json`,
      })
      .then(({ body }) => JSON.parse(body));
    assert.equal(response.tracks[0].uId, 'first_poster');
  });
});
