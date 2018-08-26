var assert = require('assert')

describe('snip.js', function () {
  var snip = require('../../app/snip.js')

  it('translateFields() should replace a mapped field', function () {
    var orig = { a: 1, b: 2 }
    var obj = Object.assign({}, orig) // clone orig
    var mapping = { b: 'bb' }
    var res = snip.translateFields(obj, mapping)
    assert(!res.b)
    assert.equal(res.bb, orig.b)
  })

  it('translateFields() should not crash on an object without prototype', function () {
    var orig = { a: 1, b: 2 }
    var obj = Object.create(null)
    Object.assign(obj, orig)
    var mapping = { b: 'bb' }
    var res = snip.translateFields(obj, mapping)
    assert(!res.b)
    assert.equal(res.bb, orig.b)
  })
})

describe('"get" package', function () {
  var get = require('../../app/lib/get')

  it('should provide the title of a web page', function (done) {
    get.Title('https://www.google.com/', function (err, title) {
      assert.ifError(err)
      assert.equal(title, 'Google')
      done()
    })
  })

  it('should provide the title of a web page encoded with an iso-2022-jp charset', function (done) {
    get.Title('http://www.mountainminds.com/tools/paramencodingtest/page/iso-2022-jp', function (err, title) {
      assert.ifError(err)
      assert.equal(title, 'iso-2022-jp Encoded Page')
      done()
    })
  })
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
    get('https://openwhyd.org', function (err, page) {
      assert.ifError(err)
      assert(page.getTitle())
      assert(page.getImages().length)
      done()
    })
  })
})

describe('"img" package', function () {
  var fs = require('fs')

  // var imgUrl = 'http://www.azurs.net/photographies/laurier-rose-fleur-rebigue.jpg';
  var imgOutput = 'public/images/landingPhoto-0.jpg'
  assert(fs.existsSync(imgOutput), imgOutput + ' should exist')
  var log = console.log

  /* // does not work on docker & travis-ci (no access to the web?)
    it('should download an image', function(done) {
        //console.log = function() {}; // prevent ContentEmbed from printing to the console
        console.log('loading img:', imgUrl);
        img.get(imgUrl, imgOutput, function () {
            //console.log = log; // restore console.log
            assert(fs.existsSync(imgOutput), imgOutput + ' should be downloaded by img.get()');
            done();
        }, function(err) {
            assert.ifError(err);
        });
    });
    */

  it('should create a thumb', function (done) {
    var thumbWidth = null // auto-scaling
    var thumbHeight = 80
    var thumbOutput = 'uniqueHash_thumb.jpg'
    try { fs.unlinkSync(thumbOutput) } catch (e) {}

    console.log = function () {} // prevent ContentEmbed from printing to the console
    var img = require('../../app/lib/my/img')
    img.makeThumb(imgOutput, thumbOutput, thumbWidth, thumbHeight, function () {
      console.log = log // restore console.log
      assert(fs.existsSync(thumbOutput), thumbOutput + ' should be created by img.makeThumb()')
      // console.log(imgOutput + ' thumb saved at ' + thumbOutput);
      // fs.unlinkSync(imgOutput);
      fs.unlinkSync(thumbOutput)
      done()
    })
  })
})

describe('track matcher', function () {
  var trackMatcher = require('../../app/models/trackMatcher.js')

  it('should not match very different tracks', function () {
    var tm = trackMatcher.TrackMatcher({
      artistName: 'Adrien',
      trackTitle: 'Joly',
      duration: 1
    })
    assert.equal(tm.evalConfidence({
      artistName: 'A d r i en',
      trackTitle: 'Jo  l y',
      duration: -22
    }).confidence, 0)
  })

  it('should match tracks with close metadata', function () {
    var tm = trackMatcher.TrackMatcher({
      artistName: 'Adrien',
      trackTitle: 'Joly',
      duration: 1
    })
    assert(tm.evalConfidence({
      artistName: 'Adrien',
      trackTitle: 'Joly',
      duration: 1.01
    }).confidence > 0.9)
  })
})

// Webdriver API documentation: http://webdriver.io/api.html
