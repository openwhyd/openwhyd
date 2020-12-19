const childProcess = require('child_process');

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

// Call this before each test to prevent side effects between tests
exports.cleanup = function (done) {
  this.timeout(4000);
  console.warn('🧹 Cleaning up test db...');
  const process = childProcess.fork('test/reset-test-db.js');
  process.on('close', () => done());
};
