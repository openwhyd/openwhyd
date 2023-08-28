//@ts-check

const fs = require('fs');
const childProcess = require('child_process');

const readFile = (file) => fs.promises.readFile(file, 'utf-8');

exports.loadEnvVars = async (file) => {
  const envVars = {};
  (await readFile(file)).split(/[\r\n]+/).forEach((envVar) => {
    if (!envVar) return;
    const [key, def] = envVar.split('=');
    envVars[key] = def.replace(/(^")|("$)/g, '');
  });
  return envVars;
};

exports.FAKE_ID = 'a0000000000000000000000a';

exports.URL_PREFIX = 'http://localhost:8080';

// inserted by config/initdb_testing.js
exports.ADMIN_USER = Object.freeze({
  id: '000000000000000000000001',
  email: process.env.WHYD_ADMIN_EMAIL || 'test@openwhyd.org',
  name: 'admin',
  username: 'admin',
  password: 'admin',
  pwd: 'admin',
  md5: '21232f297a57a5a743894a0e4a801fc3',
});

// inserted by config/initdb_testing.js
exports.DUMMY_USER = Object.freeze({
  id: '000000000000000000000002',
  email: 'dummy@openwhyd.org',
  name: 'dummy',
  handle: 'dummy',
  password: 'admin',
  pwd: 'admin',
  md5: '21232f297a57a5a743894a0e4a801fc3',
});

exports.TEST_USER = Object.freeze({
  email: 'test-user@openwhyd.org',
  name: 'Test User',
  username: 'test-user',
  pwd: 'test-user',
  password: 'test-user', // for the /register api endpoint
  md5: '42b27efc1480b4fe6d7eaa5eec47424d',
});

// Call this before each test to prevent side effects between tests
exports.cleanup = async function ({ silent } = { silent: false }) {
  this.timeout(4000);
  if (!silent) console.warn('🧹 Cleaning up test db...');
  const envFile = process.env.START_WITH_ENV_FILE
    ? await exports.loadEnvVars(process.env.START_WITH_ENV_FILE)
    : {};
  const resetDbProcess = childProcess.fork('test/reset-test-db.js', {
    env: {
      ...process.env,
      MONGODB_HOST: envFile.MONGODB_HOST || process.env.MONGODB_HOST,
      MONGODB_PORT: envFile.MONGODB_PORT || process.env.MONGODB_PORT,
    },
    silent,
  });
  resetDbProcess.stderr.on('data', (txt) => console.error(`[cleanup] ${txt}`));
  resetDbProcess.on('error', (err) => console.trace('[cleanup] error:', err));
  return new Promise((resolve) => resetDbProcess.on('close', () => resolve()));
};
