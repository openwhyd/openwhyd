var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const WAIT_DURATION = 10000;

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database

describe('re-adding a track in a playlist', function() {
  // requirement: one track should be accessible from the user's stream

  // webUI.loginAs(ADMIN_USER);

  it('will display a pop-in dialog when clicking the "Add to" button of that track', function() {
    browser.waitForContent(/Add to/);
    browser.clickOnLinkWithText('Add to');
    $('.dlgPostBox').waitForDisplayed();
  });

  it('allows to create a new playlist', function() {
    $('#selPlaylist').waitForDisplayed();
    browser.pause(1000); // leave some time for onclick handler to be setup
    $('#selPlaylist').click();
    $('#newPlaylistName').waitForDisplayed();
    $('#newPlaylistName').setValue('test playlist');
    $('input[value="Create"]').click();
    browser.waitForContent(/test playlist/, '#selPlaylist');
  });

  it('should show a link to the post after re-adding the track', function() {
    $$('.dlgPostBox span')
      .find(a => /Add/.test(a.getText()))
      .click();
    browser.waitForLinkWithText('test playlist');
  });

  it("should show the post on the user's new playlist after clicking the link", function() {
    browser.clickOnLinkWithText('test playlist');
    browser.waitUntil(
      () => /\/u\//.test(browser.getUrl()),
      WAIT_DURATION,
      "expected to be on the user's playlist page after 5s"
    );
    $('.post a[data-eid="/yt/aZT8VlTV1YY"]').waitForDisplayed();
  });

  //webUI.logout();
});

describe('track comments', function() {
  // requirement: at least one track should be accessible from the user's stream

  // webUI.loginAs(ADMIN_USER);

  it(`can be displayed from the user\'s stream`, function() {
    browser.url(URL_PREFIX + '/stream');
    browser.clickOnLinkWithText('Comment');
    browser.waitForContent(/You can mention people/);
  });

  it(`should appear after being added`, function() {
    browser.keys('hello world\n');
    browser.waitForContent(new RegExp(ADMIN_USER.name), '.comments');
    browser.waitForContent(/hello world/, '.comments');
  });

  // TODO: it(`should change after being updated`, function() {

  // TODO: it(`should disappear after being deleted`, function() {
});

describe('searching external tracks', function() {
  it(`can find a youtube track with id that starts with underscore`, function() {
    browser.url(URL_PREFIX);
    $('#q').click();
    browser.keys('http://www.youtube.com/watch?v=_BU841qpQsI');
    const searchResult = `a[onclick="window.goToPage('/yt/_BU841qpQsI');return false;"]`;
    $(searchResult).waitForDisplayed();
    const trimmed = $(searchResult)
      .getText()
      .trim();
    //console.log('text: ', trimmed);
    assert.notEqual(trimmed, ''); // empty string => no metadata was fetched, caused to https://github.com/openwhyd/openwhyd/issues/102
  });
});

// Webdriver API documentation: http://webdriver.io/api.html
