// $ npx mocha test/unit/email-validation-tests.js

const assert = require('assert');
const email = require('../../app/models/email-validation.js');

describe('email validation', function () {
  it('should allow email@domain.com', function () {
    assert(email.validate('email@domain.com'));
  });

  it('should not allow a non-string value', function () {
    const backup = console.error;
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
