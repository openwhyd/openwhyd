/* global describe, it */

var assert = require('assert');

describe('email validation', function () {
  process.appParams = { urlPrefix: '' }; // required by email module
  var email = require('../../app/models/email.js');

  it('should allow email@domain.com', function () {
    assert(email.validate('email@domain.com'));
  });

  it('should not allow a non-string value', function () {
    var backup = console.error;
    console.error = function () {}; // eslint-disable-line @typescript-eslint/no-empty-function
    assert(!email.validate(function () {})); // eslint-disable-line @typescript-eslint/no-empty-function
    console.error = backup;
  });

  // for bug https://github.com/openwhyd/openwhyd/issues/97
  it('should allow tools@symbol.agency (new tld)', function () {
    assert(email.validate('tools@symbol.agency'));
  });
});

// Webdriver API documentation: http://webdriver.io/api.html
