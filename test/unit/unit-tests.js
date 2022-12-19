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

describe('"get" package', function () {
  var get = require('../../app/lib/get');

  const expressApp = express();
  let expressServer;

  this.beforeAll((done) => {
    expressServer = expressApp.listen(3000, done);
  });

  this.afterAll(() => expressServer.close());

  it('should provide the title of a web page', function (done) {
    expressApp.get('/title.html', function (req, res) {
      res.send(HTML_PAGE_WITH_TITLE_AND_IMAGES);
    });
    get.Title('http://localhost:3000/title.html', function (err, title) {
      assert.ifError(err);
      assert.equal(title, 'foo');
      done();
    });
  });

  /*
  // TODO: serve a iso-2022-jp page to re-enable this test
  it('should provide the title of a web page encoded with an iso-2022-jp charset', function(done) {
    get.Title(
      'http://www.mountainminds.com/tools/paramencodingtest/page/iso-2022-jp',
      function(err, title) {
        assert.ifError(err);
        assert.equal(title, 'iso-2022-jp Encoded Page');
        done();
      }
    );
  });
  */
  /*
    it('should provide the title of a web page encoded with an euc-jp charset', function (done) {
        get.Title('http://charset.7jp.net/jis.html', function(err, title) {
            assert.ifError(err);
            assert.equal(title, '文字コード表 JISコード(ISO-2022-JP)');
            done();
            // => timeout
        });
    });
    */
  it('should provide the images of a web page', function (done) {
    expressApp.get('/images.html', function (req, res) {
      res.send(HTML_PAGE_WITH_TITLE_AND_IMAGES);
    });
    get('http://localhost:3000/images.html', function (err, page) {
      assert.ifError(err);
      assert(page.getTitle());
      assert(page.getImages().length);
      done();
    });
  });
});
