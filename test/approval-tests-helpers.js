const fs = require('fs');
const { promisify, ...util } = require('util');
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

function extractCookieJar(headers, origin) {
  const jar = request.jar();
  if (((headers || {})['set-cookie'] || []).length) {
    jar.setCookie(request.cookie(headers['set-cookie'][0]), origin);
  }
  return jar;
}

const httpClient = {
  get({ url, cookies }) {
    return promisify(request.get)({ uri: url, jar: cookies }).then(
      ({ body, headers }) => ({
        body,
        cookies: extractCookieJar(headers, new URL(url).origin),
      })
    );
  },
  post({ url, body, headers, cookies }) {
    if (typeof body === 'object') {
      body = JSON.stringify(body);
      headers = {
        ...headers,
        'content-type': 'application/json',
        'content-length': body.length,
      };
    }
    return promisify(request.post)({
      uri: url,
      body,
      headers,
      jar: cookies,
    }).then(({ body, headers }) => ({
      body,
      cookies: extractCookieJar(headers, new URL(url).origin),
    }));
  },
};

async function connectToMongoDB(url) {
  return await mongodb.MongoClient.connect(url, {
    useUnifiedTopology: true,
  });
}

const ObjectId = (id) => mongodb.ObjectID.createFromHexString(id);

async function readMongoDocuments(file) {
  const ISODate = (d) => new Date(d);
  return require(file)({ ObjectId, ISODate });
}

async function insertTestData(url, docsPerCollection) {
  const mongoClient = await connectToMongoDB(url);
  const db = mongoClient.db();
  await Promise.all(
    Object.keys(docsPerCollection).map(async (collection) => {
      await db.collection(collection).deleteMany({});
      await db.collection(collection).insertMany(docsPerCollection[collection]);
    })
  );
  await mongoClient.close();
}

function indentJSON(json) {
  return util.inspect(typeof json === 'string' ? JSON.parse(json) : json, {
    sorted: true,
    compact: false,
    depth: Infinity,
    breakLength: Infinity,
    maxArrayLength: Infinity,
    maxStringLength: Infinity,
  });
}

function getCleanedPageBody(body) {
  try {
    return JSON.parse(body);
  } catch (err) {
    return body
      .replace(/(src|href)="(.*\.[a-z]{2,3})\?\d+\.\d+\.\d+"/g, '$1="$2"') // remove openwhyd version from paths to html resources, to reduce noise in diff
      .replace(/>[a-zA-Z]+ \d{4}/g, '>(age)') // remove date of posts, because it depends on the time when tests are run
      .replace(/>\d+ (second|minute|hour|day|month|year)s?( ago)?/g, '>(age)'); // remove age of posts, because it depends on the time when tests are run
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
  const serverProcess = childProcess.fork('./app.js', [], {
    env,
    silent: true,
  });
  serverProcess.stderr.on('data', errPrinter);
  serverProcess.URL = `http://localhost:${env.WHYD_PORT}`;
  await waitOn({ resources: [serverProcess.URL] });
  return serverProcess;
}

/* refresh openwhyd's in-memory cache of users, to allow this user to login */
async function refreshOpenwhydCache(urlPrefix) {
  await promisify(request.post)(urlPrefix + '/testing/refresh');
}

async function startOpenwhydServer({ startWithEnv, port }) {
  if (port) {
    const URL = `http://localhost:${port}`;
    await refreshOpenwhydCache(URL);
    return { URL };
  } else if (startWithEnv) {
    const env = {
      ...(await loadEnvVars(startWithEnv)),
      MONGODB_PORT: '27117', // port exposed by docker container
      TZ: 'UTC',
    };
    return await startOpenwhydServerWith(env); // returns serverProcess instance with additional URL property (e.g. http://localhost:8080)
  }
}

module.exports = {
  loadEnvVars,
  httpClient,
  ObjectId,
  connectToMongoDB,
  readMongoDocuments,
  insertTestData,
  indentJSON,
  getCleanedPageBody,
  startOpenwhydServer,
};
