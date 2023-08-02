process.env.WHYD_GENUINE_SIGNUP_SECRET = 'whatever'; // required by ./api-client.js

const { promisify, ...util } = require('util');
const mongodb = require('mongodb');
const request = require('request');
const childProcess = require('child_process');
const { loadEnvVars } = require('./fixtures');

const makeJSONScrubber = (scrubbers) => (obj) =>
  JSON.parse(
    scrubbers.reduce((data, scrub) => scrub(data), JSON.stringify(obj)),
  );

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
      }),
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

function connectToMongoDB(url) {
  return new mongodb.MongoClient(url, {
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
    }),
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

/** This function serializes `new ObjectId` instances into objects. */
function sortAndIndentAsJSON(obj) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class ObjectId {
    constructor(id) {
      this._bsontype = 'ObjectID';
      this.id = id;
    }
  }
  return eval(indentJSON(obj));
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

/** @returns {Promise<childProcess.ChildProcessWithoutNullStreams & {exit: () => Promise<void>}>} */
const startOpenwhydServerWith = async (env) =>
  new Promise((resolve, reject) => {
    const serverProcess =
      process.env.COVERAGE === 'true'
        ? childProcess.spawn('npm', ['run', 'start:coverage:no-clean'], {
            env: { ...env, PATH: process.env.PATH },
            shell: true,
            detached: true, // when running on CI, we need this to kill the process group using `process.kill(-serverProcess.pid)`
          })
        : childProcess.fork(
            './app.js',
            ['--fakeEmail', '--digestInterval', '-1'],
            {
              env,
              silent: true, // necessary to initialize serverProcess.stderr
            },
          );
    serverProcess.URL = `http://localhost:${env.WHYD_PORT}`;
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
  });

/* refresh openwhyd's in-memory cache of users, to allow this user to login */
async function refreshOpenwhydCache(urlPrefix) {
  await promisify(request.post)(urlPrefix + '/testing/refresh');
}

/** @param {{startWithEnv:unknown, port?: number | string | undefined}} */
async function startOpenwhydServer({ startWithEnv, port }) {
  if (port) {
    const URL = `http://localhost:${port}`;
    await refreshOpenwhydCache(URL);
    return { URL };
  } else if (startWithEnv) {
    const env = {
      ...(await loadEnvVars(startWithEnv)),
      MONGODB_PORT: '27117', // port exposed by docker container // TODO: remove hard-coded mentions to port 27117
      TZ: 'UTC',
      ...process.env, // allow overrides
    };
    process.env.WHYD_GENUINE_SIGNUP_SECRET = env.WHYD_GENUINE_SIGNUP_SECRET; // required by ./api-client.js
    return { ...(await startOpenwhydServerWith(env)), env }; // returns serverProcess instance with additional URL property (e.g. http://localhost:8080)
  }
}

class OpenwhydTestEnv {
  /** @param {{ startWithEnv: string } | { port: number | string }} options */
  constructor(options) {
    this.options = options;
  }
  async setup() {
    if (this.options.startWithEnv)
      this.serverProcess = await startOpenwhydServer(this.options);
  }
  async release() {
    if (this.serverProcess && 'exit' in this.serverProcess)
      await this.serverProcess.exit();
  }
  getEnv() {
    return this.serverProcess && 'env' in this.serverProcess
      ? this.serverProcess.env
      : process.env;
  }
  async dumpCollection(collection) {
    return await dumpMongoCollection(this.getEnv().MONGODB_URL, collection);
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
  sortAndIndentAsJSON,
  getCleanedPageBody,
  startOpenwhydServer,
  OpenwhydTestEnv,
};
