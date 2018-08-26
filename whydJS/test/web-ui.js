var assert = require('assert');
var { URL_PREFIX } = require('./fixtures.js');

exports.loginAs = function(user) {
  return function() {
    browser
      .url(URL_PREFIX)
      .click('#signin')
      .waitForVisible('input[name="email"]');
    browser
      .setValue('input[name="email"]', user.email)
      .setValue('input[name="password"]', user.password)
      .click('input[type="submit"]')
      .waitForText('#loginDiv .username');
    var loggedInUsername = browser.getText('#loginDiv .username');
    assert.equal(loggedInUsername, user.name);
  };
};

exports.logout = function(user) {
  it('should allow user to log off', function() {
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
