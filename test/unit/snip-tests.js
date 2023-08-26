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

    it('should scale linearly, in terms of complexity / performance', () => {
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
});
