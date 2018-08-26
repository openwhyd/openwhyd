exports.URL_PREFIX = 'http://localhost:8080';

exports.ADMIN_USER = {
    id: '4d94501d1f78ac091dbc9b4d',
    email: process.env.WHYD_ADMIN_EMAIL || 'test@openwhyd.org',
    name: 'admin',
    username: 'admin',
    password: 'admin',
    pwd: 'admin',
    md5: '21232f297a57a5a743894a0e4a801fc3'
};

exports.TEST_USER = {
    email: 'test-user@openwhyd.org',
    name: 'Test User',
    username: 'test-user',
    pwd: 'test-user',
    password: 'test-user', // for the /register api endpoint
    md5: '42b27efc1480b4fe6d7eaa5eec47424d'
};
