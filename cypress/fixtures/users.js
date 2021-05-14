({
  // TODO: make sure that this data remains in sync with what's add in the db, in initdb_testing.js
  admin: {
    id: '000000000000000000000001',
    email: process.env.WHYD_ADMIN_EMAIL || 'test@openwhyd.org',
    name: 'admin',
    username: 'admin',
    password: 'admin',
    pwd: 'admin',
    md5: '21232f297a57a5a743894a0e4a801fc3',
  },
  dummy: {
    id: '000000000000000000000002',
    email: 'dummy@openwhyd.org',
    name: 'dummy',
    handle: 'dummy',
    username: 'dummy',
    password: 'admin',
    pwd: 'admin',
    md5: '21232f297a57a5a743894a0e4a801fc3',
  },
  testUser: {
    email: 'test-user@openwhyd.org',
    name: 'Test User',
    username: 'test-user',
    pwd: 'test-user',
    password: 'test-user', // for the /register api endpoint
    md5: '42b27efc1480b4fe6d7eaa5eec47424d',
  },
}) // prettier-ignore
