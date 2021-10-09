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

async function startOpenwhydServer(env) {
  const serverProcess = childProcess.fork(
    './app.js',
    ['--fakeEmail', '--digestInterval', '-1'],
    { env, silent: true }
  );
  await waitOn({ resources: [`http://localhost:${env.WHYD_PORT}`] });
  return serverProcess;
}

/* refresh openwhyd's in-memory cache of users, to allow this user to login */
async function refreshOpenwhydCache(urlPrefix = 'http://localhost:8080') {
  await promisify(request.post)(urlPrefix + '/testing/refresh');
}

module.exports = {
  loadEnvVars,
  readMongoDocuments,
  insertTestData,
  startOpenwhydServer,
  refreshOpenwhydCache,
};
