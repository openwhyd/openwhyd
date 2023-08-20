// $ npx mocha test/unit/unit-tests.js

const assert = require('assert');
const express = require('express');

const HTML_PAGE_WITH_TITLE_AND_IMAGES = [
  '<!DOCTYPE html>',
  '<html>',
  '<head><title>foo</title></head>',
  '<body><img src="1.jpg"></body>',
  '</html>',
].join('\n');

describe('snip.js', function () {
  var snip = require('../../app/snip.js');

  it('translateFields() should replace a mapped field', function () {
    var orig = { a: 1, b: 2 };
    var obj = Object.assign({}, orig); // clone orig
    var mapping = { b: 'bb' };
    var res = snip.translateFields(obj, mapping);
    assert(!res.b);
    assert.equal(res.bb, orig.b);
  });

  it('translateFields() should not crash on an object without prototype', function () {
    var orig = { a: 1, b: 2 };
    var obj = Object.create(null);
    Object.assign(obj, orig);
    var mapping = { b: 'bb' };
    var res = snip.translateFields(obj, mapping);
    assert(!res.b);
    assert.equal(res.bb, orig.b);
  });
});
