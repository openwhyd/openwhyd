var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const WAIT_DURATION = 10000;

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database

// Webdriver API documentation: http://webdriver.io/api.html
