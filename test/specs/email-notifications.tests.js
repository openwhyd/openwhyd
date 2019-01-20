var assert = require('assert');
var { URL_PREFIX, ADMIN_USER } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const request = require('request');

const URL_UNSUB = `${URL_PREFIX}/api/unsubscribe`;

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database
// TODO: make sure that DB was reset before starting Openwhyd's app server
// ... AND that the user cache was reset as well. (e.g. by restarting Openwhyd's server)

describe('reduce frequency of email notifications', function() {
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

  it(`user activates daily email notifications`, function() {
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

  /*
    it(`other user becomes a subscriber"`, function() {
      webUI.logout();
      webUI.loginAs(ADMIN_USER);
      browser.url(`${URL_PREFIX}/u/${user.id}`);
      browser.waitForContent(/Subscribe/);
      browser.clickOnContent('Subscribe');
    });
    */

  it(`user reduces frequency of notifications from email`, function() {
    browser.url(`${URL_UNSUB}?uId=${user.id}&type=emSub&action=reduce`);
    // URL is generated in app/templates/notifDigest.js
  });

  it(`user sees switch to weekly notifications emails`, function() {
    const response = browser.getText('body');
    console.log({ response });
    assert(/weekly/.test(response), 'response should contain "weekly"');
  });

  it(`user now has weekly email notifications"`, function() {
    browser.url(`${URL_PREFIX}/api/user`);
    const { pref } = JSON.parse(browser.getText('pre'));
    assert.equal(pref.emSub, 7);
  });

  it(`user logs out`, function() {
    webUI.clearSession();
  });
});

describe(`unsubscribe from email notifications`, function() {
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

  it(`user unsubscribes from email`, function() {
    browser.url(`${URL_UNSUB}?uId=${user.id}&type=emSub`);
    // URL is generated in app/templates/notifDigest.js
  });

  it(`user sees unsubscription message`, function() {
    const response = browser.getText('body');
    console.log({ response });
    assert(/never/.test(response), 'response should contain "never"');
    // messages are defined in app/controllers/api/unsubscribe.js
  });

  it(`user was effectively unsubscribed from email notifications"`, function() {
    browser.url(`${URL_PREFIX}/api/user`);
    const { pref } = JSON.parse(browser.getText('pre'));
    assert.equal(pref.emSub, -1);
  });

  it(`user logs out`, function() {
    webUI.clearSession();
  });
});

// Webdriver API documentation: http://webdriver.io/api.html
