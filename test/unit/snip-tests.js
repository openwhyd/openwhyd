// $ npx mocha test/unit/snip-tests.js

const assert = require('assert');

describe('snip.js', function () {
  const snip = require('../../app/snip.js');

  describe('translateFields()', function () {
    it('should replace a mapped field', function () {
      const orig = { a: 1, b: 2 };
      const obj = { ...orig }; // clone orig
      const mapping = { b: 'bb' };
      const res = snip.translateFields(obj, mapping);
      assert(!res.b);
      assert.equal(res.bb, orig.b);
    });

    it('should not crash on an object without prototype', function () {
      const orig = { a: 1, b: 2 };
      const obj = Object.create(null);
      Object.assign(obj, orig);
      const mapping = { b: 'bb' };
      const res = snip.translateFields(obj, mapping);
      assert(!res.b);
      assert.equal(res.bb, orig.b);
    });
  });

  describe('arrayToSet()', function () {
    it('should turn array items to object keys with `true` values by default', () => {
      const set = snip.arrayToSet(['a', 'b', 'c']);
      assert.deepEqual(set, { a: true, b: true, c: true });
    });

    it('should turn array items to object keys, with provided value', () => {
      const val = 'my value';
      const set = snip.arrayToSet(['a', 'b', 'c'], val);
      assert.deepEqual(set, { a: val, b: val, c: val });
    });

    it.skip('should scale linearly, in terms of complexity / performance', () => {
      const buildArray = (max) => {
        const array = [];
        for (let i = 0; i < max; ++i) array.push(i);
        return array;
      };
      const measure = (fct) => {
        const t0 = new Date();
        fct();
        return new Date() - t0;
      };
      const baseline = 10000;
      const scaleFactor = 20;
      const toleranceFactor = 1.5;
      const small = buildArray(baseline);
      const large = buildArray(baseline * scaleFactor);

      const durSmall = measure(() => snip.arrayToSet(small));
      const durLarge = measure(() => snip.arrayToSet(large));
      assert(durLarge < durSmall * scaleFactor * toleranceFactor);
    });
  });

  describe('sanitizePaginationParams()', function () {
    it('should return default values for empty params', function () {
      const result = snip.sanitizePaginationParams({});
      assert.strictEqual(result.skip, 0);
      assert.strictEqual(result.limit, 50);
    });

    it('should return valid skip and limit when provided as numbers', function () {
      const result = snip.sanitizePaginationParams({ skip: 10, limit: 20 });
      assert.strictEqual(result.skip, 10);
      assert.strictEqual(result.limit, 20);
    });

    it('should return valid skip and limit when provided as strings', function () {
      const result = snip.sanitizePaginationParams({ skip: '10', limit: '20' });
      assert.strictEqual(result.skip, 10);
      assert.strictEqual(result.limit, 20);
    });

    it('should sanitize negative skip to 0', function () {
      const result = snip.sanitizePaginationParams({ skip: -10, limit: 20 });
      assert.strictEqual(result.skip, 0);
    });

    it('should sanitize extremely negative skip to 0', function () {
      const result = snip.sanitizePaginationParams({
        skip: '-9223372036854775808',
        limit: 20,
      });
      assert.strictEqual(result.skip, 0);
    });

    it('should sanitize invalid skip to 0', function () {
      const invalidSkipValues = ['invalid', 'NaN', 'Infinity', '-Infinity'];
      invalidSkipValues.forEach((skip) => {
        const result = snip.sanitizePaginationParams({ skip, limit: 20 });
        assert.strictEqual(
          result.skip,
          0,
          `Failed for skip value: ${skip}`,
        );
      });
    });

    it('should sanitize negative limit to default', function () {
      const result = snip.sanitizePaginationParams({ skip: 0, limit: -10 });
      assert.strictEqual(result.limit, 50);
    });

    it('should sanitize zero limit to default', function () {
      const result = snip.sanitizePaginationParams({ skip: 0, limit: 0 });
      assert.strictEqual(result.limit, 50);
    });

    it('should sanitize invalid limit to default', function () {
      const invalidLimitValues = ['invalid', 'NaN', 'Infinity'];
      invalidLimitValues.forEach((limit) => {
        const result = snip.sanitizePaginationParams({ skip: 0, limit });
        assert.strictEqual(
          result.limit,
          50,
          `Failed for limit value: ${limit}`,
        );
      });
    });

    it('should cap limit at 1000 maximum', function () {
      const result = snip.sanitizePaginationParams({ skip: 0, limit: 5000 });
      assert.strictEqual(result.limit, 1000);
    });

    it('should use custom default limit', function () {
      const result = snip.sanitizePaginationParams({ skip: 0, limit: -1 }, 100);
      assert.strictEqual(result.limit, 100);
    });
  });
});
