// Note: to prevent timeout errors when running API tests for the first time,
// run $ node -e 'require("./test/fixtures.js").cleanup()'

const fs = require('fs');

const loadEnvVars = (file) => {
  const envVars = {};
  try {
    fs.readFileSync(file, 'utf-8')
      .split(/[\r\n]+/)
      .forEach((envVar) => {
        if (!envVar) return;
        const [key, def] = envVar.split('=');
        envVars[key] = def.replace(/^"(.*)"$/, '$1');
      });
  } catch (err) {
    console.warn(`failed to load env vars from ${file}`);
  }
  return envVars;
};

Object.assign(process.env, loadEnvVars('./env-vars-testing.conf'));

const { startOpenwhydServer } = require('./approval-tests-helpers');
const { resetTestDb } = require('./reset-test-db.js');

exports.URL_PREFIX = 'http://localhost:8080';

// inserted by config/initdb_testing.js
exports.ADMIN_USER = {
  id: '000000000000000000000001',
  email: process.env.WHYD_ADMIN_EMAIL || 'test@openwhyd.org',
  name: 'admin',
  username: 'admin',
  password: 'admin',
  pwd: 'admin',
  md5: '21232f297a57a5a743894a0e4a801fc3',
};

// inserted by config/initdb_testing.js
exports.DUMMY_USER = {
  id: '000000000000000000000002',
  email: 'dummy@openwhyd.org',
  name: 'dummy',
  handle: 'dummy',
  password: 'admin',
  pwd: 'admin',
  md5: '21232f297a57a5a743894a0e4a801fc3',
};

exports.TEST_USER = {
  email: 'test-user@openwhyd.org',
  name: 'Test User',
  username: 'test-user',
  pwd: 'test-user',
  password: 'test-user', // for the /register api endpoint
  md5: '42b27efc1480b4fe6d7eaa5eec47424d',
};

let currentMongoInstance;
let openwhydServer;

// Call this before each test to prevent side effects between tests
exports.cleanup = async function () {
  openwhydServer?.kill('SIGKILL');

  if (process.env.TEST_WITH_FAKE_MONGO) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    await currentMongoInstance?.stop();
    currentMongoInstance = await MongoMemoryServer.create({
      binary: { version: '3.4.24' }, // completed from docker-compose.yml
    });
    const mongoURL = new URL(currentMongoInstance.getUri());
    process.env.MONGODB_HOST = mongoURL.hostname;
    process.env.MONGODB_PORT = mongoURL.port;
  }

  if (typeof this.timeout === 'function') this.timeout(4000); // for mocha, when called from a test suite
  console.warn('🧹 Cleaning up test db...');
  await resetTestDb();

  console.warn('🚀 Starting Openwhyd server...');
  openwhydServer = await startOpenwhydServer({
    startWithEnv: './env-vars-testing.conf',
    mongoDbPort: process.env.MONGODB_PORT,
  });

  console.warn(`ℹ️  Runnning on ${openwhydServer.URL} (press Ctrl-C to exit)`);
};
