const fs = require('fs');
const { promisify } = require('util');
const mongodb = require('mongodb');
const request = require('request');
const childProcess = require('child_process');
const waitOn = require('wait-on');

const readFile = (file) => fs.promises.readFile(file, 'utf-8');

const loadEnvVars = async (file) => {
  const envVars = {};
  (await readFile(file)).split(/[\r\n]+/).forEach((envVar) => {
    if (!envVar) return;
    const [key, def] = envVar.split('=');
    envVars[key] = def.replace(/^"|"$/g, '');
  });
  return envVars;
};

async function readMongoDocuments(file) {
  const ISODate = (d) => new Date(d);
  const ObjectId = (id) => mongodb.ObjectID.createFromHexString(id);
  return eval(await readFile(file));
}

async function insertTestData(url, docsPerCollection) {
  const mongoClient = await mongodb.MongoClient.connect(url, {
    useUnifiedTopology: true,
  });
  const db = mongoClient.db();
  await Promise.all(
    Object.keys(docsPerCollection).map(async (collection) => {
      await db.collection(collection).deleteMany({});
      await db.collection(collection).insertMany(docsPerCollection[collection]);
    })
  );
  await mongoClient.close();
}

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

const errPrinter = ((blocklist) => {
  return (chunk) => {
    const message = chunk.toString();
    if (!blocklist.some((term) => message.includes(term)))
      console.error(message);
  };
})([
  'closing server',
  'deprecated',
  'gm: command not found',
  'convert: command not found',
  'please install graphicsmagick',
]);

async function startOpenwhydServerWith(env) {
  const serverProcess = childProcess.fork(
    './app.js',
    ['--fakeEmail', '--digestInterval', '-1'],
    { env, silent: true }
  );
  serverProcess.stderr.on('data', errPrinter);
  await waitOn({ resources: [`http://localhost:${env.WHYD_PORT}`] });
  return serverProcess;
}

/* refresh openwhyd's in-memory cache of users, to allow this user to login */
async function refreshOpenwhydCache(urlPrefix = 'http://localhost:8080') {
  await promisify(request.post)(urlPrefix + '/testing/refresh');
}

async function startOpenwhydServer(envFileForProgamaticStart) {
  if (envFileForProgamaticStart) {
    const env = {
      ...(await loadEnvVars(envFileForProgamaticStart)),
      MONGODB_PORT: '27117', // port exposed by docker container
      TZ: 'UTC',
    };
    process.env.WHYD_GENUINE_SIGNUP_SECRET = env.WHYD_GENUINE_SIGNUP_SECRET; // required by ./api-client.js
    return await startOpenwhydServerWith(env);
  } else {
    process.env.WHYD_GENUINE_SIGNUP_SECRET = 'whatever'; // required by ./api-client.js
    await refreshOpenwhydCache();
  }
}

module.exports = {
  loadEnvVars,
  readMongoDocuments,
  insertTestData,
  getCleanedPageBody,
  startOpenwhydServer,
  refreshOpenwhydCache,
};
