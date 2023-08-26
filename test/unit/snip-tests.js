// $ npx mocha test/unit/snip-tests.js

const assert = require('assert');

describe('snip.js', function () {
  const snip = require('../../app/snip.js');

  it('translateFields() should replace a mapped field', function () {
    const orig = { a: 1, b: 2 };
    const obj = { ...orig }; // clone orig
    const mapping = { b: 'bb' };
    const res = snip.translateFields(obj, mapping);
    assert(!res.b);
    assert.equal(res.bb, orig.b);
  });

  it('translateFields() should not crash on an object without prototype', function () {
    const orig = { a: 1, b: 2 };
    const obj = Object.create(null);
    Object.assign(obj, orig);
    const mapping = { b: 'bb' };
    const res = snip.translateFields(obj, mapping);
    assert(!res.b);
    assert.equal(res.bb, orig.b);
  });
});
