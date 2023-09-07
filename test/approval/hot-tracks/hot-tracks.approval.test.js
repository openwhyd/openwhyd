// Run with: $ npm run test:approval:hot-tracks
//   ... or: $ npm run test:approval:hot-tracks -- --updateSnapshot

const waitOn = require('wait-on');
const {
  httpClient,
  ObjectId,
  connectToMongoDB,
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

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

const users = [
  {
    _id: ObjectId('61e19a3f078b4c9934e72ce1'),
    name: 'user 0',
    email: 'users[0]@test.com',
    pwd: '21232f297a57a5a743894a0e4a801fc3',
  },
  {
    _id: ObjectId('61e19a3f078b4c9934e72ce2'),
    name: 'user 1',
    email: 'users[1]@test.com',
    pwd: '21232f297a57a5a743894a0e4a801fc3',
  },
];

const tracks = [
  {
    _id: ObjectId('61e19a3f078b4c9934e72ce6'),
    eId: '/yt/track_A',
    score: 0,
  },
  {
    _id: ObjectId('61e19a3f078b4c9934e72ce7'),
    eId: '/yt/track_B',
    score: 0,
  },
];

const loginUsers = (server, users) =>
  Promise.all(
    users.map(({ email, pwd }) =>
      httpClient.get({
        url: `${server.getURL()}/login?action=login&ajax=1&email=${email}&md5=${pwd}`,
      }),
    ),
  );

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function postTrack(server, userSession, { _id, ...trackData }) {
  const { body } = await httpClient.post({
    url: `${server.getURL()}/api/post`,
    body: { action: 'insert', ...trackData },
    cookies: userSession.cookies,
  });
  return JSON.parse(body);
}

describe('Hot Tracks (approval tests - to be replaced later by unit tests)', () => {
  /** @type import('mongodb').MongoClient */
  let mongoClient;
  /** @type import('mongodb').Db */
  let db;

  beforeAll(async () => {
    await openwhyd.setup();
    if (PORT) {
      await waitOn({ resources: [`http://localhost:${PORT}`], timeout: 1000 });
    }
    // if this test times out, make sure to start MongoDB first: $ docker-compose up -d mongo
    mongoClient = await connectToMongoDB(MONGODB_URL);
    db = await mongoClient.db();
  });

  afterAll(async () => {
    if (mongoClient) await mongoClient.close();
    if (!DONT_KILL) await openwhyd.release();
  });

  beforeEach(async () => {
    await openwhyd.reset(); // prevent side effects between tests by resetting db state
    await db.collection('user').deleteMany({}); // clear users
    await db.collection('post').deleteMany({}); // clear posts
    await db.collection('track').deleteMany({}); // clear tracks
  });

  it('renders a limited number of ranked posts', async () => {
    await db.collection('post').insertMany([
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce4'),
        name: 'a regular track',
        nbR: 1,
      },
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce5'),
        name: 'a popular track',
        nbR: 2,
      },
    ]);
    await openwhyd.refreshCache();
    const json = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?limit=1&format=json`,
    });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?limit=1&`,
    });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
  });

  it('renders ranked posts, starting at a given index', async () => {
    await db.collection('post').insertMany([
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce4'),
        name: 'a regular track',
        nbR: 1,
      },
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce5'),
        name: 'a popular track',
        nbR: 2,
      },
    ]);
    await openwhyd.refreshCache();
    const json = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?skip=1&format=json`,
    });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?skip=1&`,
    });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
  });

  it('renders posts enriched with track metadata', async () => {
    const posts = [
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce4'),
        eId: tracks[0].eId,
        nbR: 1,
        pl: { name: 'soundtrack of my life', id: 0 }, // metadata from the post that will be included in the list of hot tracks
      },
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce5'),
        eId: tracks[1].eId,
        nbR: 2,
        text: 'my favorite track ever!', // metadata from the post that will be included in the list of hot tracks
      },
    ];
    await db.collection('post').insertMany(posts);
    await openwhyd.refreshCache();
    const json = await httpClient.get({
      url: `${openwhyd.getURL()}/hot?format=json`,
    });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({ url: `${openwhyd.getURL()}/hot` });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
  });
});
