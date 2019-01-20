var assert = require('assert');
var { URL_PREFIX, ADMIN_USER: user } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const request = require('request');

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database
// TODO: make sure that DB was reset before starting Openwhyd's app server
// ... AND that the user cache was reset as well. (e.g. by restarting Openwhyd's server)

describe('email notifications', function() {
  let user;

  it('create a test user', function() {
    const username = 'test-email-notif-user-' + new Date().getTime();
    user = webUI.signup({
      username,
      email: `${username}@openwhyd.org`,
      password: `dummy`
    });
  });

  it(`user has instant email notifications"`, function() {
    assert.equal(user.pref.emSub, 0);
  });

  it(`activate daily email notifications`, function() {
    browser.url(`${URL_PREFIX}/settings`).waitForContent(/Notifications/);
    browser.clickOnContent('Notifications');
    browser.waitForContent(/Daily/);
    browser.clickOnContent('Daily');
    browser.clickOnVisibleSelector('input[type="submit"]');
  });

  it(`user now has daily email notifications"`, function() {
    browser.url(`${URL_PREFIX}/api/user`);
    const { pref } = JSON.parse(browser.getText('pre'));
    assert.equal(pref.emSub, 1);
  });

  //webUI.logout();
});

// Webdriver API documentation: http://webdriver.io/api.html
