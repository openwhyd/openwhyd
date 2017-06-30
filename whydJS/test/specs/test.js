var assert = require('assert');

var URL_PREFIX = 'http://localhost:8080';

before(function() {
    // openwhyd/whydjs server should be tested again the test database
    browser.url(URL_PREFIX + '/login?action=login&email=test%40openwhyd.org&md5=21232f297a57a5a743894a0e4a801fc3');
    browser.url(URL_PREFIX + '/admin/config/config.json');
    var config = JSON.parse(browser.getText('pre')).json;
    assert.equal(config.mongoDbDatabase, 'openwhyd_test');
    browser.url(URL_PREFIX + '/login?action=logout');
});

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

// Webdriver API documentation: http://webdriver.io/api.html
