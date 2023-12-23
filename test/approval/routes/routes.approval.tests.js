// Run with: $ npm run test:approval:routes

const test = require('ava');
const { promisify } = require('util');
const {
  readMongoDocuments,
  insertTestData,
  getCleanedPageBody,
} = require('../../approval-tests-helpers');
const { OpenwhydTestEnv } = require('../../OpenwhydTestEnv');

const {
  START_WITH_ENV_FILE,
  PORT, // Note: if PORT is not provided, approval-tests-helpers will start Openwhyd's server programmatically, using START_WITH_ENV_FILE
  DONT_KILL,
} = process.env;

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

const testDataDir = `${__dirname}/test-data`;

const openwhyd = new OpenwhydTestEnv({
  startWithEnv: START_WITH_ENV_FILE,
  port: PORT,
});

test.before(async (t) => {
  const testDataCollections = {
    user: await readMongoDocuments(testDataDir + '/approval.users.json.js'),
    post: await readMongoDocuments(testDataDir + '/approval.posts.json.js'),
    follow: await readMongoDocuments(testDataDir + '/approval.follows.json.js'),
  };
  await insertTestData(MONGODB_URL, testDataCollections);

  await openwhyd.setup(); // starts openwhyd, or refreshes its state if already running
  t.context.openwhyd = require('../../api-client');
  t.context.getUser = (id) =>
    testDataCollections.user.find(({ _id }) => id === _id.toString());
});

test.after(async () => {
  if (!DONT_KILL) await openwhyd.release();
});

const personas = [
  { label: 'Visitor', userId: undefined },
  { label: 'User: Adrien', userId: '4d94501d1f78ac091dbc9b4d' },
  { label: 'User: A New User', userId: '000000000000000000000003' },
];

const formats = ['HTML', 'JSON'];

const routes = [
  { label: 'Home, page 1', path: '/' },
  { label: 'Home, page 2', path: '/?after=601d160ea7db502dd31d204e' },
  { label: "Adrien's Profile, page 1", path: '/adrien' },
  {
    label: "Adrien's Profile, page 2",
    path: '/adrien?after=600ec1c703e2014e630c8137',
  },
  { label: "Adrien's Profile - liked tracks", path: '/adrien/likes' },
  { label: "Adrien's Profile - playlists", path: '/adrien/playlists' },
  { label: "Adrien's Profile - playlist 1", path: '/adrien/playlist/1' },
  {
    label: "Adrien's Profile - subscriptions",
    path: '/adrien/subscriptions',
    jsonPath: '/api/follow/fetchFollowing/4d94501d1f78ac091dbc9b4d',
  },
  {
    label: "Adrien's Profile - subscribers",
    path: '/adrien/subscribers',
    jsonPath: '/api/follow/fetchFollowers/4d94501d1f78ac091dbc9b4d',
  },
  { label: 'All tracks, page 1', path: '/all' }, // TODO: fix the rendering of that page in JSON format
  { label: 'All tracks, page 2', path: '/all?after=601d160ea7db502dd31d204e' },
  {
    label: "A New User's Profile, page 1",
    path: '/u/000000000000000000000003',
  },
  {
    label: "A New User's Profile - liked tracks",
    path: '/u/000000000000000000000003/likes',
  },
  {
    label: "A New User's Profile - playlists",
    path: '/u/000000000000000000000003/playlists',
  },
  {
    label: "A New User's Profile - playlist 1",
    path: '/u/000000000000000000000003/playlist/1',
  },
  {
    label: "A New User's Profile - subscriptions",
    path: '/u/000000000000000000000003/subscriptions',
    jsonPath: '/api/follow/fetchFollowing/000000000000000000000003',
  },
  {
    label: "A New User's Profile - subscribers",
    path: '/u/000000000000000000000003/subscribers',
    jsonPath: '/api/follow/fetchFollowers/000000000000000000000003',
  },
  {
    label: 'Unknown Profile',
    path: '/u/000000000000000000000004',
  },
  {
    label: "Adrien's Profile - Playlist creation",
    path: '/adrien/playlist/create',
  },
  {
    label: "A New User's Profile - Playlist creation",
    path: '/u/000000000000000000000003/playlist/create',
  },
];

formats.forEach((format) => {
  routes.forEach((route) => {
    personas.forEach((persona) => {
      test(`${persona.label}, ${route.label}, ${format}`, async (t) => {
        const { openwhyd } = t.context;
        // 1. login (or logout) and make sure that it worked as expected
        const { userId } = persona;
        const { jar, loggedIn, response } =
          persona.label === 'Visitor'
            ? await promisify(openwhyd.logout)(null)
            : await promisify(openwhyd.loginAs)(t.context.getUser(userId));
        if (userId && !loggedIn) {
          t.fail(`login failed: ${response.body}`);
        }
        // 2. test that the response is still the same
        const path =
          format === 'JSON'
            ? route.jsonPath ||
              route.path.replace(/\?|$/, `?format=${format.toLowerCase()}&`)
            : route.path;
        const { body } = await promisify(openwhyd.getRaw)(jar, path);
        t.snapshot(await getCleanedPageBody(body));
      });
    });
  });
});
