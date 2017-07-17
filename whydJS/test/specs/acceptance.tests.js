var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js')

// TODO: make sure that DB is clear
// mongo openwhyd_test --eval "db.dropDatabase();"

function takeSnapshot() {
    var results = browser.checkDocument(); // http://webdriver.io/guide/services/visual-regression.html
    results.forEach((result) => {
        assert(result.isWithinMisMatchTolerance, 'a difference was find on a snapshot');
    });
}

browser.waitForContent = function(regex) {
    return browser.waitUntil(() => regex.test(browser.getHTML('body')), 5000, `${regex} should be in the page within 5 seconds`);
};

before(function() {
    // make sure that openwhyd/whydjs server is tested against the test database
    browser.url(URL_PREFIX + `/login?action=login&email=${encodeURIComponent(ADMIN_USER.email)}&md5=${ADMIN_USER.md5}`);
    browser.url(URL_PREFIX + '/admin/config/config.json');
    var config = JSON.parse(browser.getText('pre')).json;
    assert.equal(config.mongoDbDatabase, 'openwhyd_test');
    browser.url(URL_PREFIX + '/login?action=logout');
});

// reference scenario: https://www.youtube.com/watch?v=aZT8VlTV1YY

describe('landing page page', function() {

    it('should not let visitors access admin endpoints', function () {
        browser.url(URL_PREFIX + '/admin/config/config.json');
        assert(!browser.isExisting('pre'));
    });

    it('should have Openwhyd in its title', function () {
        browser.url(URL_PREFIX);
        var title = browser.getTitle();
        assert(/Openwhyd/.test(title));
    });

    it('should not have changed from previous build', function() {
        browser.url(URL_PREFIX);
        var results = browser.checkDocument(); // http://webdriver.io/guide/services/visual-regression.html
        results.forEach((result) => {
            assert(result.isWithinMisMatchTolerance);
        });
    });
});

describe('onboarding', function() {

    it('should lead new user to genre selection page', function() {
        browser
            .url(URL_PREFIX)
            .click('#signup')
            .waitForVisible('input[name="email"]');
        browser
            .setValue('input[name="name"]', TEST_USER.username)
            .setValue('input[name="email"]', TEST_USER.email)
            .setValue('input[name="password"]', TEST_USER.pwd);
        // TODO: takeSnapshot();
        browser
            .click('input[type="submit"]')
            .waitUntil(
                () => /.*\/pick\/genres/.test(browser.getUrl()), 5000,
                'expected to be on /pick/genres after 5s'
            );
        // TODO: takeSnapshot();
    });

    it('should suggest people to follow after picking genres', function() {
        const genres = $$('#genreGallery li');
        genres.find(genre => /INDIE/.test(genre.getText())).click();
        genres.find(genre => /ROCK/.test(genre.getText())).click();
        genres.find(genre => /PUNK/.test(genre.getText())).click();
        // TODO: takeSnapshot();
        $$('a').find(a => a.getText() === 'Next').click();
        browser.waitUntil(
            () => /.*\/pick\/people/.test(browser.getUrl()), 5000,
            'expected to be on /pick/people after 5s'
        );
    });

    it('should suggest to install the extension after picking people', function() {
        // TODO: takeSnapshot();
        $$('a').find(a => a.getText() === 'Next').click();
        browser.waitUntil(
            () => /.*\/pick\/button/.test(browser.getUrl()), 5000,
            'expected to be on /pick/button after 5s'
        );
    });

    it('should lead new user to the welcome page, after installing extension', function() {
        // TODO: takeSnapshot();
        $$('a').find(a => a.getText() === 'Next').click();
        browser.waitUntil(
            () => /.*\/welcome/.test(browser.getUrl()), 5000,
            'expected to be on /welcome after 5s'
        );
    });

    it('should display user name after skipping the welcome tutorial', function() {
        // TODO: takeSnapshot();
        browser.waitForContent(/Ok\, Got it/);
        $$('div').find(a => /Ok\, Got it/.test(a.getText())).click();
        var loggedInUsername = browser.getText('#loginDiv .username');
        assert.equal(loggedInUsername, TEST_USER.username);
    });

    it('should allow user to log off', function() {
        browser.moveToObject('#settingsDiv');
        $('#settingsDiv').click();
        $$('a').find(a => a.getText() === 'Logout').click();
        browser.waitUntil(
            () => /\/login/.test(browser.getUrl()), 5000,
            'expected to be on /login after 5s'
        );
    });

});

describe('adding a track', function() {

    // TODO: replace following it() by loginAs(ADMIN_USER); -- for re-use

    it('should allow user to login', function() {
        browser
            .url(URL_PREFIX)
            .click('#signin')
            .waitForVisible('input[name="email"]');
        browser
            .setValue('input[name="email"]', ADMIN_USER.email)
            .setValue('input[name="password"]', ADMIN_USER.password)
            .click('input[type="submit"]')
            .waitForText('#loginDiv .username');
        var loggedInUsername = browser.getText('#loginDiv .username');
        assert.equal(loggedInUsername, ADMIN_USER.name);
    });

    it('should recognize a track when pasting a Youtube URL in the search box', function() {
        $('#q').setValue('https://www.youtube.com/watch?v=aZT8VlTV1YY');
        browser.waitUntil(
            () => $$('#searchResults li a').find(a => /Demo/.test(a.getText())), 5000,
            'expected to find a search result after 5s'
        );
    });

    it('should lead to a track page when clicking on the Youtube search result', function() {
        browser.click('#searchResults li a');
        browser.waitUntil(
            () => /\/yt\/aZT8VlTV1YY/.test(browser.getUrl()), 5000,
            'expected to be on /yt/aZT8VlTV1YY after 5s'
        );
    });

    it('should open a dialog after clicking on the "Add to" button', function() {
        browser.waitForContent(/Add to/);
        $$('a').find(a => /Add to/.test(a.getText())).click();
        browser.waitForVisible('.dlgPostBox');
    });

    it('should show a link to the post after adding the track', function() {
        $$('.dlgPostBox span').find(a => /Add/.test(a.getText())).click();
        browser.waitUntil(
            () => $$('a').find(a => /your tracks/.test(a.getText())), 5000,
            'expected to find a "your tracks" link after 5s');
    });

    it('should show the post on the user\'s profile after clicking the link', function() {
        $$('a').find(a => /your tracks/.test(a.getText())).click();
        browser.waitUntil(
            () => /\/u\//.test(browser.getUrl()), 5000,
            'expected to be on the user\'s profile page after 5s');
        browser.waitForVisible('.post a[data-eid="/yt/aZT8VlTV1YY"]');
    });

    it('should open the playbar after the user clicks on the post', function() {
        browser.click('.post a[data-eid="/yt/aZT8VlTV1YY"]');
        browser.waitForVisible('#btnPlay');
    });

    it('should play the track', function() {
        browser.waitForVisible('#btnPlay.playing');
    });

    it('should pause the track when the user clicks on the play/pause button', function() {
        browser.click('#btnPlay.playing');
        assert(!/playing/.test($('#btnPlay').classname));
    });

    it('should allow user to log off', function() {
        browser.moveToObject('#settingsDiv');
        $('#settingsDiv').click();
        $$('a').find(a => a.getText() === 'Logout').click();
        browser.waitUntil(
            () => /\/login/.test(browser.getUrl()), 5000,
            'expected to be on /login after 5s'
        );
    });

});

// Webdriver API documentation: http://webdriver.io/api.html
