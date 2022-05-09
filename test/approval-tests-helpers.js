const fs = require('fs');
const { promisify, ...util } = require('util');
const mongodb = require('mongodb');
const request = require('request');
const waitOn = require('wait-on');
const childProcess = require('child_process');

const makeJSONScrubber = (scrubbers) => (obj) =>
  JSON.parse(
    scrubbers.reduce((data, scrub) => scrub(data), JSON.stringify(obj))
  );

const readFile = (file) => fs.promises.readFile(file, 'utf-8');

// backup standard output, to prevent cumulative pollution from successive runs of app.js
const consoleLog = console.log;
const consoleWarn = console.warn;
const consoleError = console.error;

const loadEnvVars = async (file) => {
  const envVars = {};
  (await readFile(file)).split(/[\r\n]+/).forEach((envVar) => {
    if (!envVar) return;
    const [key, def] = envVar.split('=');
    envVars[key] = def.replace(/^"(.*)"$/, '$1');
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
      const docs = docsPerCollection[collection];
      if (docs.length > 0) await db.collection(collection).insertMany(docs);
    })
  );
  await mongoClient.close();
}

async function dumpMongoCollection(url, collection) {
  const mongoClient = await connectToMongoDB(url);
  const db = mongoClient.db();
  const documents = await db.collection(collection).find({}).toArray();
  await mongoClient.close();
  return documents;
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
    if (process.env.DEBUG || !blocklist.some((term) => message.includes(term)))
      console.error(message);
  };
})([
  'server.close => OK',
  'closing server',
  'deprecated',
  'gm: command not found',
  'convert: command not found',
  'please install graphicsmagick',
]);

async function startOpenwhydServerWith(env) {
  let serverProcess;
  if (process.env.COVERAGE === 'true') {
    serverProcess = childProcess.spawn('npm', ['run', 'start:coverage:no-clean'], {
      env: { ...env, PATH: process.env.PATH },
      shell: true,
      detached: true, // when running on CI, we need this to kill the process group using `process.kill(-serverProcess.pid)`
    });
    serverProcess.exit = () =>
      new Promise((resolve) => {
        if (serverProcess.killed) return resolve();
        serverProcess.on('close', resolve);
        if (!(serverProcess.kill(/*'SIGTERM'*/))) {
          console.warn('🧟‍♀️ failed to kill childprocess!');
        }
        if (serverProcess.pid) {
          try {
            process.kill(-serverProcess.pid, 'SIGINT');
          } catch (err) {
            console.warn('failed to kill by pid:', err.message);
          }
        }
      });
    serverProcess.on('error', reject);
    serverProcess.stderr.on('data', errPrinter);
    serverProcess.stdout.on('data', (str) => {
      if (process.env.DEBUG) errPrinter(str);
      if (str.includes('Server running')) resolve(serverProcess);
    });
  } else {
    Object.assign(process.env, env);
    delete require.cache[require.resolve('../app.js')]; // force Node.js to re-intepret app.js, even if it was already executed
    console.log = consoleLog;
    console.warn = consoleWarn;
    console.error = consoleError;
    const app = require('../app.js');
    serverProcess = {
      kill: () =>
        app?.appServer?.stop((err) => (err ? console.error('kill()', err) : {})),
    };
  }
  
  serverProcess.URL = `http://localhost:${env.WHYD_PORT}`;
  await waitOn({ resources: [serverProcess.URL] });
  return serverProcess;
}

/* refresh openwhyd's in-memory cache of users, to allow this user to login */
async function refreshOpenwhydCache(urlPrefix) {
  await promisify(request.post)(urlPrefix + '/testing/refresh');
}

async function startOpenwhydServer({ startWithEnv, port, mongoDbPort }) {
  if (port) {
    process.env.WHYD_GENUINE_SIGNUP_SECRET = 'whatever'; // required by ./api-client.js
    const URL = `http://localhost:${port}`;
    await refreshOpenwhydCache(URL);
    return { URL };
  } else if (startWithEnv) {
    const env = {
      ...(await loadEnvVars(startWithEnv).catch((err) =>
        err ? console.warn(`failed to load env vars from ${startWithEnv}`) : {}
      )),
      MONGODB_PORT: mongoDbPort || '27117', // port exposed by docker container
      TZ: 'UTC',
    };
    process.env.WHYD_GENUINE_SIGNUP_SECRET = env.WHYD_GENUINE_SIGNUP_SECRET; // required by ./api-client.js
    return await startOpenwhydServerWith(env); // returns serverProcess instance with additional URL property (e.g. http://localhost:8080)
  }
}

module.exports = {
  makeJSONScrubber,
  loadEnvVars,
  httpClient,
  ObjectId,
  connectToMongoDB,
  readMongoDocuments,
  dumpMongoCollection,
  insertTestData,
  indentJSON,
  getCleanedPageBody,
  startOpenwhydServer,
};
