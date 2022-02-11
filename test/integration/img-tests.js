const assert = require('assert');
const fs = require('fs');

describe('"img" package', function () {
  //var imgUrl = 'http://www.azurs.net/photographies/laurier-rose-fleur-rebigue.jpg';
  var imgOutput = 'public/images/logo-s.png';
  assert(fs.existsSync(imgOutput), imgOutput + ' should exist');
  var log = console.log;

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

  it.skip('should create a thumb', function (done) {
    var thumbWidth = null; // auto-scaling
    var thumbHeight = 80;
    var thumbOutput = 'uniqueHash_thumb.jpg';
    try {
      fs.unlinkSync(thumbOutput);
    } catch (e) {
      console.error(e.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    console.log = function () {}; // prevent ContentEmbed from printing to the console
    var img = require('../../app/lib/my-img');
    img.makeThumb(imgOutput, thumbOutput, thumbWidth, thumbHeight, function () {
      console.log = log; // restore console.log
      assert(
        fs.existsSync(thumbOutput),
        thumbOutput + ' should be created by img.makeThumb()'
      );
      //console.log(imgOutput + ' thumb saved at ' + thumbOutput);
      //fs.unlinkSync(imgOutput);
      fs.unlinkSync(thumbOutput);
      done();
    });
  });
});
