// $ npx mocha test/unit/safeApiErrors-tests.js

const assert = require('assert');
const {
  sanitizeApiResponse,
  GENERIC_ERROR,
} = require('../../app/controllers/api/safeApiErrors.js');

describe('safeApiErrors.js', function () {
  describe('sanitizeApiResponse()', function () {
    const USER_FACING_ERRORS = ['user not found', /^Must be at least \d+$/];
    const sanitize = (result) =>
      sanitizeApiResponse('test', result, USER_FACING_ERRORS);

    let originalConsoleError;
    let loggedErrors;
    beforeEach(() => {
      loggedErrors = [];
      originalConsoleError = console.error;
      console.error = (...args) => loggedErrors.push(args.join(' '));
    });
    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('should return results without error as-is', function () {
      const result = { ok: 1, name: 'Adrien' };
      assert.strictEqual(sanitize(result), result);
      assert.strictEqual(sanitize(undefined), undefined);
      assert.deepEqual(sanitize([1, 2]), [1, 2]);
      assert.deepEqual(sanitize({ error: undefined }), { error: undefined });
      assert.equal(loggedErrors.length, 0);
    });

    it('should return user-facing errors, without other fields', function () {
      assert.deepEqual(sanitize({ error: 'user not found', field: 'x' }), {
        error: 'user not found',
      });
      assert.deepEqual(sanitize({ error: 'Must be at least 3' }), {
        error: 'Must be at least 3',
      });
      assert.equal(loggedErrors.length, 0);
    });

    it('should replace and log an Error object', function () {
      const err = Object.assign(
        new Error("ENOENT: no such file or directory, open '/usr/src/app/x'"),
        { code: 'ENOENT', path: '/usr/src/app/x' },
      );
      assert.deepEqual(sanitize({ error: err }), { error: GENERIC_ERROR });
      assert.equal(loggedErrors.length, 1);
      assert.match(
        loggedErrors[0],
        /\[test\] ERROR: .*ENOENT.*\/usr\/src\/app\/x/,
      );
    });

    it('should replace and log an unexpected error message', function () {
      assert.deepEqual(sanitize({ error: 'String is too short (0 chars)' }), {
        error: GENERIC_ERROR,
      });
      assert.deepEqual(sanitize({ error: 'user not found: 123' }), {
        error: GENERIC_ERROR,
      });
      assert.equal(loggedErrors.length, 2);
    });

    it('should replace and log a database error object', function () {
      const dbError = { code: 11000, keyValue: { email: 'a@b.c' } };
      assert.deepEqual(sanitize({ error: dbError }), { error: GENERIC_ERROR });
      assert.match(loggedErrors[0], /11000/);
    });

    it('should log errors on a single line', function () {
      sanitize({ error: new Error('line 1\nline 2') });
      assert(!loggedErrors[0].includes('\n'));
    });
  });
});
