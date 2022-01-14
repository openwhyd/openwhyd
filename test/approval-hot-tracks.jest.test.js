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

describe('Hot Tracks (approval tests - to be replaced later by unit tests)', () => {
  let mongoClient;
  let db;
  let server;

  beforeAll(async () => {
    // if this test times out, make sure to start MongoDB first: $ docker-compose up -d mongo
    mongoClient = await connectToMongoDB(MONGODB_URL);
    db = await mongoClient.db();
  });

  afterAll(async () => {
    await mongoClient.close();
    server?.kill('SIGKILL');
  });

  beforeEach(async () => {
    server?.kill('SIGKILL');
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
    const users = [
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce1'),
        name: 'user 0',
        email: 'user0@test.com',
        pwd: '21232f297a57a5a743894a0e4a801fc3',
      },
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce2'),
        name: 'user 1',
        email: 'user1@test.com',
        pwd: '21232f297a57a5a743894a0e4a801fc3',
      },
    ];
    await db.collection('user').insertMany(users);
    await db.collection('track').insertMany([
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
    ]);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const userSession = [
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${users[0].email}&md5=${users[0].pwd}`,
      }),
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${users[1].email}&md5=${users[1].pwd}`,
      }),
    ];
    // user 0 posts track A
    const post = await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', eId: '/yt/track_A' },
      cookies: userSession[0].cookies,
    });
    const postId = JSON.parse(post.body)._id;
    const cleanJSON = (body) =>
      body.replaceAll(postId, '61e1adfea49d3bced4f8c183');
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
    const users = [
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce1'),
        name: 'user 0',
        email: 'user0@test.com',
        pwd: '21232f297a57a5a743894a0e4a801fc3',
      },
      {
        _id: ObjectId('61e19a3f078b4c9934e72ce2'),
        name: 'user 1',
        email: 'user1@test.com',
        pwd: '21232f297a57a5a743894a0e4a801fc3',
      },
    ];
    await db.collection('user').insertMany(users);
    await db.collection('track').insertMany([
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
    ]);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const userSession = [
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${users[0].email}&md5=${users[0].pwd}`,
      }),
      await httpClient.get({
        url: `${server.URL}/login?action=login&ajax=1&email=${users[1].email}&md5=${users[1].pwd}`,
      }),
    ];
    // user 0 posts track A
    const post = await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', eId: '/yt/track_A' },
      cookies: userSession[0].cookies,
    });
    const postId = JSON.parse(post.body)._id;
    const cleanJSON = (body) =>
      body.replaceAll(postId, '61e1adfea49d3bced4f8c183');
    // user 1 reposts track A
    const repost = await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', pId: postId },
      cookies: userSession[1].cookies,
    });
    console.log('repost', repost.body);
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    const json = await httpClient.get({ url: `${server.URL}/hot?format=json` });
    expect(cleanJSON(indentJSON(json.body))).toMatchSnapshot();
    // Note: the requests above mutate data => we snapshot the state of the "tracks" table.
    const tracksCollection = await db.collection('track').find({}).toArray();
    expect(cleanJSON(indentJSON(tracksCollection))).toMatchSnapshot(); // TODO: the score should be different
  });
});
