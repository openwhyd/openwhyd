var assert = require('assert');
describe('landing page page', function() {
    it('should have Openwhyd in its title', function () {
        browser.url('http://localhost:8080');
        var title = browser.getTitle();
        assert(/Openwhyd/.test(title));
    });
});
