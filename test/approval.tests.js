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
  return body
    .replace(/(src|href)="(.*\.[a-z]{2,3})\?\d+\.\d+\.\d+"/g, '$1="$2"') // remove openwhyd version from paths to html resources, to reduce noise in diff
    .replace(/>[a-zA-Z]+ \d{4}/g, '>(age)') // remove date of posts, because it depends on the time when tests are run
    .replace(/>\d+ (day|month|year)s?( ago)?/g, '>(age)'); // remove age of posts, because it depends on the time when tests are run
}

test.before(async (t) => {
  const users = await readMongoDocuments(__dirname + '/approval.users.json');
  const posts = await readMongoDocuments(__dirname + '/approval.posts.json');
  await insertTestData(MONGODB_URL, users, posts);
  await refreshOpenwhydCache();
  t.context.user = users[0];
});

const personaLabels = ['Visitor', 'User'];
const formats = ['HTML', 'JSON'];
const routes = [
  { label: 'Home, page 1', path: '/' },
  { label: 'Home, page 2', path: '/?after=600ec1c703e2014e630c8137' },
  { label: 'Profile, page 1', path: '/adrien' },
  { label: 'Profile, page 2', path: '/adrien?after=600ec1c703e2014e630c8137' },
  { label: 'Profile - liked tracks', path: '/adrien/likes' },
  { label: 'Profile - playlists', path: '/adrien/playlists' },
  { label: 'Profile - playlist 1', path: '/adrien/playlist/1' },
  // TODO: profil utilisateur: ... playlist, historique, abonnés et abonnements
  // TODO: contenus partagés par d'autres utilisateurs (cf `LibAll.js` et `LibFriends.js`)
  // TODO: écran de création de playlist
];

formats.forEach((format) => {
  routes.forEach((route) => {
    personaLabels.forEach((persona) => {
      test(`${persona}, ${route.label}, ${format}`, async (t) => {
        const { jar, loggedIn } =
          persona === 'Visitor'
            ? await promisify(openwhyd.logout)(null)
            : await promisify(openwhyd.loginAs)(t.context.user);
        if (persona === 'User') t.true(loggedIn); // just to make sure that login worked as expected
        const path =
          format === 'HTML'
            ? route.path
            : route.path.replace(/\?|$/, `?format=${format.toLowerCase()}&`);
        const { body } = await promisify(openwhyd.getRaw)(jar, path);
        const cleanedBody =
          format === 'HTML' ? await getCleanedPageBody(body) : JSON.parse(body);
        t.snapshot(cleanedBody);
      });
    });
  });
});
