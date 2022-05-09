// Run with: $ npm run test:approval

const approvals = require('approvals').mocha();
const util = require('util');
const request = require('request');
const { URL_PREFIX } = require('../fixtures.js');

const {
  START_WITH_ENV_FILE,
  PORT, // Note: if PORT is not provided, approval-tests-helpers will start Openwhyd's server programmatically, using START_WITH_ENV_FILE
  DONT_KILL,
} = process.env;

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

approvals.configure({
  reporters: ['nodediff'], // displays colors in diff
  forceApproveAll: process.env.AUTO_APPROVE === 'true',
});

const scrubObjectId =
  (objectId) =>
  (data = '') =>
    data.replaceAll(objectId, '__OBJECT_ID__');

const makePostFromBk = (user) => ({
  uId: user._id,
  uNm: user.name,
  text: '',
  name: 'BOYLE - Roppongi Hills (Music Video)',
  eId: '/yt/jI3YrVfOksE',
  ctx: 'bk',
  img: 'https://i.ytimg.com/vi/jI3YrVfOksE/default.jpg',
  src: {
    id: 'https://www.youtube.com/watch?v=jI3YrVfOksE',
    name: 'BOYLE - Roppongi Hills (Music Video) - YouTube',
  },
});

async function setupTestEnv() {
  const {
    makeJSONScrubber,
    ObjectId,
    dumpMongoCollection,
    readMongoDocuments,
    insertTestData,
    startOpenwhydServer,
  } = require('../approval-tests-helpers');
  const api = require('../api-client');
  const context = {
    api,
    makeJSONScrubber,
    ObjectId,
    dumpMongoCollection,
    insertTestData,
  };
  // insert fixtures / test data
  context.testDataCollections = {
    user: await readMongoDocuments(__dirname + '/../approval.users.json.js'),
    post: [], // await readMongoDocuments(__dirname + '/../approval.posts.json.js'),
  };
  await insertTestData(MONGODB_URL, context.testDataCollections);
  // start openwhyd server
  context.serverProcess = await startOpenwhydServer({
    startWithEnv: START_WITH_ENV_FILE,
    port: PORT,
  });
  return context;
}

async function teardownTestEnv(context) {
  if (context.serverProcess && !DONT_KILL) {
    await context.serverProcess.exit();
  }
}

// basic example / template for next tests
describe('When setting up a new test environment', function () {
  let context;

  before(async () => {
    context = await setupTestEnv();
  });

  after(() => teardownTestEnv(context));

  it('should have an empty "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(dbPosts);
  });

  it('should have the initial "user" db collection', async function () {
    const dbUsers = await context.dumpMongoCollection(MONGODB_URL, 'user');
    this.verifyAsJSON(dbUsers);
  });
});

describe('When posting a track', () => {
  let context;
  let postedTrack;
  let scrub;

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    const post = {
      eId: '/yt/XdJVWSqb4Ck',
      name: 'Lullaby - Jack Johnson and Matt Costa',
    };
    const { jar } = await util.promisify(context.api.loginAs)(user);
    postedTrack = (await util.promisify(context.api.addPost)(jar, post)).body;
    scrub = context.makeJSONScrubber([scrubObjectId(postedTrack._id)]);
  });

  after(() => teardownTestEnv(context));

  it('should be listed in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should be provided in the API response', async function () {
    this.verifyAsJSON(scrub(postedTrack));
  });
});

describe('When posting a track using the bookmarklet', function () {
  let context;
  let postedTrack;
  let scrub;

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    const post = makePostFromBk(user);
    const { jar } = await util.promisify(context.api.loginAs)(user);
    postedTrack = (await util.promisify(context.api.addPost)(jar, post)).body;
    scrub = context.makeJSONScrubber([scrubObjectId(postedTrack._id)]);
  });

  after(() => teardownTestEnv(context));

  it('should be listed in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should be provided in the API response', async function () {
    this.verifyAsJSON(scrub(postedTrack));
  });
});

describe('When posting a track using the bookmarklet, using a HTTP GET request', function () {
  let context;
  let postedTrack;
  const pl = { id: '2', name: '🎸 Rock' }; // existing playlist
  let scrub;

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    const post = makePostFromBk(user);
    const { jar } = await util.promisify(context.api.loginAs)(user);
    postedTrack = JSON.parse(
      await new Promise((resolve, reject) =>
        request.get(
          {
            jar,
            url: `${URL_PREFIX}/api/post?action=insert&eId=${encodeURIComponent(
              post.eId
            )}&name=${encodeURIComponent(
              post.name
            )}&src[id]=${encodeURIComponent(
              post.src.id
            )}&src[name]=${encodeURIComponent(
              post.src.name
            )}&pl[id]=${encodeURIComponent(
              pl.id
            )}&pl[name]=${encodeURIComponent(pl.name)}`,
          },
          (error, response, body) => (error ? reject(error) : resolve(body))
        )
      )
    );
    scrub = context.makeJSONScrubber([scrubObjectId(postedTrack._id)]);
  });

  after(() => teardownTestEnv(context));

  it('should be listed in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should be provided in the API response', async function () {
    this.verifyAsJSON(scrub(postedTrack));
  });
});

describe('When renaming a track', function () {
  const newName = 'coucou';
  let context;
  let postedTrack;
  let renamedTrack;
  let scrub;

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    await context.insertTestData(MONGODB_URL, { post: [makePostFromBk(user)] });
    postedTrack = (await context.dumpMongoCollection(MONGODB_URL, 'post'))[0];

    const { jar } = await util.promisify(context.api.loginAs)(user);
    const renameResponse = await new Promise((resolve, reject) =>
      request.post(
        {
          jar,
          form: {
            action: 'insert',
            eId: postedTrack.eId,
            name: newName,
            _id: postedTrack._id.toString(),
            pl: { id: null, name: 'full stream' },
          },
          url: `${URL_PREFIX}/api/post`,
        },
        (error, response, body) =>
          error ? reject(error) : resolve({ response, body })
      )
    );
    renamedTrack = JSON.parse(renameResponse.body);
    scrub = context.makeJSONScrubber([
      scrubObjectId(postedTrack._id.toString()),
    ]);
  });

  after(() => teardownTestEnv(context));

  it('should be listed with new name in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should include the new name in the API response', async function () {
    this.verifyAsJSON(scrub(renamedTrack));
  });
});

describe('When posting a track to an existing playlist', function () {
  let context;
  let postedTrack;
  let scrub;
  const pl = { id: '2', name: '🎸 Rock' };

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    const post = { ...makePostFromBk(user), pl };
    const { jar } = await util.promisify(context.api.loginAs)(user);
    postedTrack = (await util.promisify(context.api.addPost)(jar, post)).body;
    scrub = context.makeJSONScrubber([scrubObjectId(postedTrack._id)]);
  });

  after(() => teardownTestEnv(context));

  it('should be listed in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should not update the user\'s playlists in the "user" db collection', async function () {
    const dbUsers = await context.dumpMongoCollection(MONGODB_URL, 'user');
    this.verifyAsJSON(dbUsers);
  });

  it('should be provided in the API response', async function () {
    this.verifyAsJSON(scrub(postedTrack));
  });
});

describe('When posting a track to a new playlist', function () {
  let context;
  let postedTrack;
  let scrub;
  const pl = { id: 'create', name: 'My New Playlist' };

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    const post = { ...makePostFromBk(user), pl };
    const { jar } = await util.promisify(context.api.loginAs)(user);
    postedTrack = (await util.promisify(context.api.addPost)(jar, post)).body;
    scrub = context.makeJSONScrubber([scrubObjectId(postedTrack._id)]);
  });

  after(() => teardownTestEnv(context));

  it('should be listed in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should update the user\'s playlists in the "user" db collection', async function () {
    const dbUsers = await context.dumpMongoCollection(MONGODB_URL, 'user');
    this.verifyAsJSON(dbUsers); // Note: this reveals a bug in the automatic numbering of new playlists, when playlists are listed in reverse order, cf https://github.com/openwhyd/openwhyd-solo/blob/73734c0ab665f6701af7aa8b5b9ce635ad8a2b2f/app/models/user.js#L434
  });

  it('should be provided in the API response', async function () {
    this.verifyAsJSON(scrub(postedTrack));
  });
});

describe('When reposting a track to an existing playlist', function () {
  let context;
  let originalTrack;
  let repostedTrack;
  let scrub;
  const pl = { id: '2', name: '🎸 Rock' };

  before(async () => {
    context = await setupTestEnv();
    const user = context.testDataCollections.user[0];
    await context.insertTestData(MONGODB_URL, { post: [makePostFromBk(user)] });
    originalTrack = (await context.dumpMongoCollection(MONGODB_URL, 'post'))[0];

    const { jar } = await util.promisify(context.api.loginAs)(user);
    repostedTrack = (
      await util.promisify(context.api.addPost)(jar, {
        eId: originalTrack.eId,
        name: originalTrack.name,
        pId: originalTrack._id.toString(),
        pl,
      })
    ).body;
    scrub = context.makeJSONScrubber([
      scrubObjectId(originalTrack._id),
      scrubObjectId(repostedTrack._id),
    ]);
  });

  after(() => teardownTestEnv(context));

  it('should both be listed in the "post" db collection', async function () {
    const dbPosts = await context.dumpMongoCollection(MONGODB_URL, 'post');
    this.verifyAsJSON(scrub(dbPosts));
  });

  it('should not update the user\'s playlists in the "user" db collection', async function () {
    const dbUsers = await context.dumpMongoCollection(MONGODB_URL, 'user');
    this.verifyAsJSON(dbUsers);
  });

  it('should be provided in the API response', async function () {
    this.verifyAsJSON(scrub(repostedTrack));
  });
});
