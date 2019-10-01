var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const WAIT_DURATION = 10000;

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database
// TODO: make sure that DB was reset before starting Openwhyd's app server

describe('bookmarklet - adding from a youtube track', function () {
  it(`user login`, webUI.loginAs(ADMIN_USER));

  it(`should load a youtube page`, function () {
    browser.url('https://www.youtube.com/watch?v=-F9vo4Z5lO4');
    browser.waitForContent(/1sec/);
  });

  it('should load the bookmarklet', function () {
    browser.injectJS(`${URL_PREFIX}/js/bookmarklet.js`);
  });

  it(`should have the bookmarklet loaded`, function () {
    function getBookmarklet() {
      return window._initWhydBk;
    }
    return !!browser.execute(getBookmarklet);
    // TODO: create a re-usable waitForSymbol() wdio command
  });

  it(`should find the page's track in the list`, function () {
    $('.whydThumb').waitForExist();
  });

  /*
  // this code was useful to detect that chrome was not loading insecure/mixed content
  it(`should output browser log`, function () {
    console.log('browser log:', browser.log('browser').value.filter(i => i.level === 'SEVERE'));
    //console.log('driver log:', browser.log('driver').value.slice(-10));
    //console.log('client log:', browser.log('client').value.slice(-10));
    //console.log('server log:', browser.log('server').value.slice(-10));
    // TODO: create a re-usable displayLogs() wdio command
  });
  */
});

describe('bookmarklet - adding a second time from same youtube page', function () {
  it('should close the bookmarklet', function () {
    $('#whydHeader div').click();
  });

  it('should load the bookmarklet', function () {
    browser.injectJS(`${URL_PREFIX}/js/bookmarklet.js`);
  });

  it(`should find the page's track in the list`, function () {
    $('.whydThumb').waitForExist();
  });

  /*
  it(`should output browser log`, function () {
    console.log('browser log:', browser.log('browser').value.slice(-30));
    // TODO: create a re-usable displayLogs() wdio command
  });
  */

  // TODO: check that adding the track works

  //webUI.logout();
});

// Webdriver API documentation: http://webdriver.io/api.html
