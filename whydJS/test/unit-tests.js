var assert = require('assert');

describe('"get" package', function() {

    var get = require('get');

    it('should provide the title of a web page', function (done) {
        get.Title('https://www.google.com/', function(err, title) {
            assert.ifError(err);
            assert.equal(title, 'Google');
            done();
        });
    });

    it('should provide the title of a web page encoded with an iso-2022-jp charset', function (done) {
        get.Title('http://www.mountainminds.com/tools/paramencodingtest/page/iso-2022-jp', function(err, title) {
            assert.ifError(err);
            assert.equal(title, 'iso-2022-jp Encoded Page');
            done();
        });
    });
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
            assert.ifError(err);
            assert(page.getTitle());
            assert(page.getImages().length);
            done();
        });
    });
});

describe('"img" package', function() {
    it('should create a thumb from a downloaded image', function(done) {
        var fs = require('fs');
        var img = require('../node_modules/my/img');

        var imgUrl = 'http://www.azurs.net/photographies/laurier-rose-fleur-rebigue.jpg';
        var imgOutput = 'uniqueHash.jpg';
        var thumbOutput = 'uniqueHash_thumb.jpg';
        var thumbWidth = null; // auto-scaling
        var thumbHeight = 80;

        img.get(imgUrl, imgOutput, function () {
            assert(fs.existsSync(imgOutput), imgOutput + ' should be downloaded by img.get()');
            img.makeThumb(imgOutput, thumbOutput, thumbWidth, thumbHeight, function () {
                assert(fs.existsSync(thumbOutput), thumbOutput + ' should be created by img.makeThumb()');
                //console.log(imgOutput + ' thumb saved at ' + thumbOutput);
                fs.unlinkSync(imgOutput);
                fs.unlinkSync(thumbOutput);
                done();
            });
        });
    });
});

// Webdriver API documentation: http://webdriver.io/api.html
