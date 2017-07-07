var assert = require('assert');

describe('"get" package', function() {
    it('should provide the title of a web page', function (done) {
        var get = require('get');
        get.Title('https://www.google.com/', function(err, title) {
            assert.equal(title, 'Google');
            done();
        });
    });
});

// Webdriver API documentation: http://webdriver.io/api.html
