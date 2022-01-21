// Run with: $ npm run test-approval-hot-tracks
//   ... or: $ npm run test-approval-hot-tracks -- --updateSnapshot

const {
  httpClient,
  ObjectId,
  connectToMongoDB,
  startOpenwhydServer,
  indentJSON,
  getCleanedPageBody,
} = require('./approval-tests-helpers');

const { START_WITH_ENV_FILE } = process.env;

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

const user0 = {
  _id: ObjectId('61e19a3f078b4c9934e72ce1'),
  name: 'user 0',
  email: 'user0@test.com',
  pwd: '21232f297a57a5a743894a0e4a801fc3',
};

const user1 = {
  _id: ObjectId('61e19a3f078b4c9934e72ce2'),
  name: 'user 1',
  email: 'user1@test.com',
  pwd: '21232f297a57a5a743894a0e4a801fc3',
};

const track0 = {
  _id: ObjectId('61e19a3f078b4c9934e72ce6'),
  eId: '/yt/track_A',
  score: 0,
};

const track1 = {
  _id: ObjectId('61e19a3f078b4c9934e72ce7'),
  eId: '/yt/track_B',
  score: 0,
};

describe('Hot Tracks (approval tests - to be replaced later by unit tests)', () => {
  let mongoClient;
  let db;
  let server;

  beforeAll(async () => {
    // TODO: check that openwhyd server is not already running on port 8080
    // if this test times out, make sure to start MongoDB first: $ docker-compose up -d mongo
    mongoClient = await connectToMongoDB(MONGODB_URL);
    db = await mongoClient.db();
  });

  afterAll(async () => {
    await mongoClient.close();
    if (server?.kill) server.kill('SIGKILL');
  });

  beforeEach(async () => {
    if (server?.kill) server.kill('SIGKILL');
    await db.collection('user').deleteMany({}); // clear users
    await db.collection('post').deleteMany({}); // clear posts
    await db.collection('track').deleteMany({}); // clear tracks
  });

  it('renders ranked tracks', async () => {
    await db.collection('track').insertMany([
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce4'),
        name: 'a regular track',
        score: 1,
      },
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce5'),
        name: 'a popular track',
        score: 2,
      },
    ]);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const json = await httpClient.get({ url: `${server.URL}/hot?format=json` });
    expect(indentJSON(json.body)).toMatchSnapshot();
    const html = await httpClient.get({ url: `${server.URL}/hot` });
    expect(getCleanedPageBody(html.body)).toMatchSnapshot();
    // Note: the request above does not mutate data => no need to snapshot the state of the "tracks" table.
  });

  it("updates the score of a track when it's liked", async () => {
    await db.collection('user').insertMany([user0, user1]);
    await db.collection('track').insertMany([track0, track1]);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const userSession = [
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${user0.email}&md5=${user0.pwd}`,
      }),
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${user1.email}&md5=${user1.pwd}`,
      }),
    ];
    // user 0 posts track A
    const post = await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', eId: track0.eId },
      cookies: userSession[0].cookies,
    });
    const postId = JSON.parse(post.body)._id;
    const cleanJSON = (body) => body.replaceAll(postId, '__posted_track_id__');
    // user 1 likes track A
    await httpClient.post({
      url: `${server.URL}/api/post/${postId}`,
      body: { action: 'toggleLovePost' },
      cookies: userSession[1].cookies,
    });
    const json = await httpClient.get({ url: `${server.URL}/hot?format=json` });
    expect(cleanJSON(indentJSON(json.body))).toMatchSnapshot();
    // Note: the requests above mutate data => we snapshot the state of the "tracks" table.
    const tracksCollection = await db.collection('track').find({}).toArray();
    expect(cleanJSON(indentJSON(tracksCollection))).toMatchSnapshot();
  });

  it("updates the score of a track when it's reposted", async () => {
    await db.collection('user').insertMany([user0, user1]);
    await db.collection('track').insertMany([track0, track1]);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const userSession = [
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${user0.email}&md5=${user0.pwd}`,
      }),
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${user1.email}&md5=${user1.pwd}`,
      }),
    ];
    // user 0 posts track A
    const post = await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', eId: track0.eId },
      cookies: userSession[0].cookies,
    });
    const postId = JSON.parse(post.body)._id;
    const cleanJSON = (body) => body.replaceAll(postId, '__posted_track_id__');
    // user 1 reposts track A
    await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', pId: postId },
      cookies: userSession[1].cookies,
    });
    await new Promise((resolve) => setTimeout(resolve, 3000)); // give time for track model to take the repost into account
    const json = await httpClient.get({ url: `${server.URL}/hot?format=json` });
    expect(cleanJSON(indentJSON(json.body))).toMatchSnapshot();
    // Note: the requests above mutate data => we snapshot the state of the "tracks" table.
    const tracksCollection = await db.collection('track').find({}).toArray();
    expect(cleanJSON(indentJSON(tracksCollection))).toMatchSnapshot(); // TODO: write test to make sure that the score is different
  });
});
