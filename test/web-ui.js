var assert = require('assert');
var { URL_PREFIX } = require('./fixtures.js');

exports.signup = function ({ email, password, username }) {
  const WAIT_DURATION = 5000;
  console.log('[signup] create user', { email });
  browser
    .url(URL_PREFIX);
  $('#signup').click();
  $('input[name="email"]').waitForDisplayed();
  browser
    .setValue('input[name="name"]', username)
    .setValue('input[name="email"]', email)
    .setValue('input[name="password"]', password);
  $('input[type="submit"]').click();
  console.log('[signup] consent');
  browser
    .url(`${URL_PREFIX}/consent`)
    .scroll('input[type="checkbox"]');
  $('input[type="checkbox"]').click();
  $('input[type="submit"]').click();
  browser.waitUntil(
    () => !/consent/.test(browser.getUrl()),
    WAIT_DURATION,
    'expected to be on / after 5s'
  );
  console.log('[signup] fetch user data');
  browser.url(`${URL_PREFIX}/api/user`);
  return JSON.parse(browser.getText('pre'));
};

exports.loginAs = function (user) {
  return function () {
    browser
      .url(URL_PREFIX);
    $('#signin').click();
    $('input[name="email"]').waitForDisplayed();
    browser
      .setValue('input[name="email"]', user.email)
      .setValue('input[name="password"]', user.password);
    $('input[type="submit"]').click();
    browser.waitForText('#loginDiv .username');
    var loggedInUsername = browser.getText('#loginDiv .username');
    assert.equal(loggedInUsername, user.name);
  };
};

exports.logout = function (user) {
  it('should allow user to log off', function () {
    //browser.moveToObject('#settingsDiv');
    $('#settingsDiv').click();
    $$('a')
      .find(a => a.getText() === 'Logout')
      .click();
    browser.waitUntil(
      () => /\/login/.test(browser.getUrl()),
      5000,
      'expected to be on /login after 5s'
    );
  });
};

exports.clearSession = () => browser.url(`${URL_PREFIX}/login?action=logout`);
