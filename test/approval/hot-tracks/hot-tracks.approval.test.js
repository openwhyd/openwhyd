// @ts-check

// Run with: $ npm run test:approval:hot-tracks
//   ... or: $ npm run test:approval:hot-tracks -- --updateSnapshot

const { beforeAll, afterAll, expect } = require('@jest/globals');

const {
  httpClient,
  ObjectId,
  indentJSON,
  getCleanedPageBody,
} = require('../../approval-tests-helpers');
const { OpenwhydTestEnv } = require('../../OpenwhydTestEnv');

const {
  START_WITH_ENV_FILE,
  PORT, // Note: if PORT is not provided, approval-tests-helpers will start Openwhyd's server programmatically, using START_WITH_ENV_FILE
  DONT_KILL,
} = process.env;

const openwhyd = new OpenwhydTestEnv({
  startWithEnv: START_WITH_ENV_FILE,
  port: PORT,
});

const twoPosts = [
  {
    _id: ObjectId('61e19a3f078b4c9934e72ce4'),
    eId: '/yt/track_A',
    name: 'a regular track',
    nbR: 1,
  },
  {
    _id: ObjectId('61e19a3f078b4c9934e72ce5'),
    eId: '/yt/track_B',
    name: 'a popular track',
    nbR: 2,
  },
];

describe('Hot Tracks', () => {
  /** @type import('mongodb').Db */
  let db;

  beforeAll(async () => {
    await openwhyd.setup();
    db = openwhyd.getMongoClient().db();
  });

  afterAll(async () => {
    if (!DONT_KILL) await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
  });

  it('renders a limited number of ranked posts', async () => {
    await db.collection('post').insertMany(twoPosts);
    await openwhyd.refreshCache();
    const json = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?sinceId=000000000000000000000001&limit=1&format=json`,
    });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?sinceId=000000000000000000000001&limit=1`,
    });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
  });

  it('renders ranked posts, starting at a given index', async () => {
    await db.collection('post').insertMany(twoPosts);
    await openwhyd.refreshCache();
    const json = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?sinceId=000000000000000000000001&skip=1&format=json`,
    });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?sinceId=000000000000000000000001&skip=1&`,
    });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
  });

  it('renders posts enriched with track metadata', async () => {
    await db.collection('post').insertMany([
      {
        ...twoPosts[0],
        pl: { name: 'soundtrack of my life', id: 0 }, // metadata from the post that will be included in the list of hot tracks
      },
      {
        ...twoPosts[1],
        text: 'my favorite track ever!', // metadata from the post that will be included in the list of hot tracks
      },
    ]);
    await openwhyd.refreshCache();
    const json = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?sinceId=000000000000000000000001&format=json`,
    });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?sinceId=000000000000000000000001`,
    });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
  });
});
