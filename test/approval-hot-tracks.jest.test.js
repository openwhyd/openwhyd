// Run with: $ npm run test-approval-hot-tracks

const {
  httpClient,
  connectToMongoDB,
  startOpenwhydServer,
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
    await db.collection('user').deleteMany({});
    await db.collection('track').deleteMany({});
  });

  it('renders ranked tracks', async () => {
    await db.collection('track').insertMany([
      { name: 'a regular track', score: 1 },
      { name: 'a popular track', score: 2 },
    ]);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const { body } = await httpClient.get({ url: `${server.URL}/hot` });
    expect(body).toMatchSnapshot();
    // Note: the request above does not mutate data => no need to snapshot the state of the "tracks" table.
  });

  it("updates the score of a track when it's reposted", async () => {
    const users = [
      { id: 0, name: 'user 0', pwd: '123' },
      { id: 1, name: 'user 1', pwd: '456' },
    ];
    await db.collection('user').insertMany(users);
    server = await startOpenwhydServer(START_WITH_ENV_FILE);
    const userSession = [
      await httpClient.post({ url: `${server.URL}/api/login`, body: users[0] }),
      await httpClient.post({ url: `${server.URL}/api/login`, body: users[1] }),
    ];
    const posts = [
      // user 0 posts track A
      await httpClient.post({
        url: `${server.URL}/api/post`,
        body: { action: 'insert', eId: 'track_A' },
        cookies: userSession[0].cookies,
      }),
      // user 0 posts track B
      await httpClient.post({
        url: `${server.URL}/api/post`,
        body: { action: 'insert', eId: 'track_B' },
        cookies: userSession[0].cookies,
      }),
    ];
    // user 1 reposts track A
    await httpClient.post({
      url: `${server.URL}/api/post`,
      body: { action: 'insert', pId: posts[0].pId },
      cookies: userSession[1].cookies,
    });
    const { body } = await httpClient.get({
      url: `${server.URL}/hot?format=json`,
    });
    expect(body).toMatchSnapshot();
    // Note: the requests above mutate data => we snapshot the state of the "tracks" table.
    const tracksCollection = await db.collection('tracks').find({}).toArray();
    expect(tracksCollection).toMatchSnapshot();
  });
});
