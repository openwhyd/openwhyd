// Before running these tests, make sure that:
// - Openwhyd is running on port 8080 (`$ docker-compose up --build`)
// - Its database is empty but initialized

const test = require('ava');
const { promisify } = require('util');
const {
  loadEnvVars,
  startOpenwhydServer,
  refreshOpenwhydCache,
  readMongoDocuments,
  insertTestData,
} = require('./db-helpers');

const START_WITH_ENV_FILE = process.env.START_WITH_ENV_FILE;

const MONGODB_URL =
  process.env.MONGODB_URL || 'mongodb://localhost:27117/openwhyd_test';

async function getCleanedPageBody(body) {
  try {
    return JSON.parse(body);
  } catch (err) {
    return body
      .replace(/(src|href)="(.*\.[a-z]{2,3})\?\d+\.\d+\.\d+"/g, '$1="$2"') // remove openwhyd version from paths to html resources, to reduce noise in diff
      .replace(/>[a-zA-Z]+ \d{4}/g, '>(age)') // remove date of posts, because it depends on the time when tests are run
      .replace(/>\d+ (day|month|year)s?( ago)?/g, '>(age)'); // remove age of posts, because it depends on the time when tests are run
  }
}

test.before(async (t) => {
  const testDataCollections = {
    user: await readMongoDocuments(__dirname + '/approval.users.json'),
    post: await readMongoDocuments(__dirname + '/approval.posts.json'),
    follow: await readMongoDocuments(__dirname + '/approval.follows.json'),
  };
  await insertTestData(MONGODB_URL, testDataCollections);

  if (START_WITH_ENV_FILE) {
    const env = {
      ...(await loadEnvVars(START_WITH_ENV_FILE)),
      MONGODB_PORT: '27117', // port exposed by docker container
      TZ: 'UTC',
    };
    process.env.WHYD_GENUINE_SIGNUP_SECRET = env.WHYD_GENUINE_SIGNUP_SECRET; // required by ./api-client.js
    t.context.serverProcess = await startOpenwhydServer(env);
  } else {
    process.env.WHYD_GENUINE_SIGNUP_SECRET = 'whatever'; // required by ./api-client.js
    await refreshOpenwhydCache();
  }

  t.context.openwhyd = require('./api-client');
  t.context.getUser = (id) =>
    testDataCollections.user.find(({ _id }) => id === _id.toString());
});

test.after((t) => {
  if (t.context.serverProcess) {
    t.context.serverProcess.kill();
  }
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
        const { userId } = persona;
        const { jar, loggedIn, response } =
          persona.label === 'Visitor'
            ? await promisify(openwhyd.logout)(null)
            : await promisify(openwhyd.loginAs)(t.context.getUser(userId));
        if (userId && !loggedIn) t.fail(`login failed: ${response.body}`); // just to make sure that login worked as expected
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
