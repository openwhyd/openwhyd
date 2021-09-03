// Before running these tests, make sure that:
// - Openwhyd is running on port 8080 (`$ docker-compose up --build`)
// - Its database is empty but initialized

const test = require('ava');
const { promisify } = require('util');
const openwhyd = require('./api-client');
const {
  readMongoDocuments,
  insertTestData,
  refreshOpenwhydCache,
} = require('./db-helpers');

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
  // import test data
  const users = await readMongoDocuments(__dirname + '/approval.users.json');
  await insertTestData(MONGODB_URL, {
    user: users,
    post: await readMongoDocuments(__dirname + '/approval.posts.json'),
    follow: await readMongoDocuments(__dirname + '/approval.follows.json'),
  });
  await refreshOpenwhydCache();
  t.context.user = users[0];
});

const personas = [
  { label: 'Visitor', userId: undefined },
  { label: 'User: Adrien', userId: '4d94501d1f78ac091dbc9b4d' },
  // { label: 'User: A New User', userId: '000000000000000000000003' }, // TODO
];
const formats = ['HTML', 'JSON'];
const routes = [
  { label: 'Home, page 1', path: '/' },
  { label: 'Home, page 2', path: '/?after=601d160ea7db502dd31d204e' },
  { label: 'Profile, page 1', path: '/adrien' },
  { label: 'Profile, page 2', path: '/adrien?after=600ec1c703e2014e630c8137' },
  { label: 'Profile - liked tracks', path: '/adrien/likes' },
  { label: 'Profile - playlists', path: '/adrien/playlists' },
  { label: 'Profile - playlist 1', path: '/adrien/playlist/1' },
  {
    label: 'Profile - subscriptions',
    path: '/adrien/subscriptions',
    jsonPath: '/api/follow/fetchFollowing/4d94501d1f78ac091dbc9b4d',
  },
  {
    label: 'Profile - subscribers',
    path: '/adrien/subscribers',
    jsonPath: '/api/follow/fetchFollowers/4d94501d1f78ac091dbc9b4d',
  },
  { label: 'All tracks, page 1', path: '/all' }, // TODO: fix the rendering of that page in JSON format
  { label: 'All tracks, page 2', path: '/all?after=601d160ea7db502dd31d204e' },
  { label: 'Empty Profile, page 1', path: '/u/000000000000000000000003' },
  {
    label: 'Empty Profile - liked tracks',
    path: '/u/000000000000000000000003/likes',
  },
  {
    label: 'Empty Profile - playlists',
    path: '/u/000000000000000000000003/playlists',
  },
  {
    label: 'Empty Profile - playlist 1',
    path: '/u/000000000000000000000003/playlist/1',
  },
  {
    label: 'Empty Profile - subscriptions',
    path: '/u/000000000000000000000003/subscriptions',
    jsonPath: '/api/follow/fetchFollowing/000000000000000000000003',
  },
  {
    label: 'Empty Profile - subscribers',
    path: '/u/000000000000000000000003/subscribers',
    jsonPath: '/api/follow/fetchFollowers/000000000000000000000003',
  },
  {
    label: 'Unknown Profile',
    path: '/u/000000000000000000000004',
  },
  // TODO: listes vides du point de vue de son utilisateur propriétaire
  // TODO: écran de création de playlist
];

formats.forEach((format) => {
  routes.forEach((route) => {
    personas.forEach((persona) => {
      test(`${persona.label}, ${route.label}, ${format}`, async (t) => {
        const { jar, loggedIn } =
          persona.label === 'Visitor'
            ? await promisify(openwhyd.logout)(null)
            : await promisify(openwhyd.loginAs)(t.context.user); // TODO: use userId
        if (persona.userId) t.true(loggedIn); // just to make sure that login worked as expected
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
