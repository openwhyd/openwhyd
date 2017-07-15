var assert = require('assert');
var fs = require('fs');
var img = require('../node_modules/my/img');

var imgUrl = 'http://www.azurs.net/photographies/laurier-rose-fleur-rebigue.jpg';
var imgOutput = 'uniqueHash.jpg';
var thumbOutput = 'uniqueHash_thumb.jpg';
var thumbWidth = null; // auto-scaling
var thumbHeight = 80;

img.get(imgUrl, imgOutput, function() {
  assert(fs.existsSync(imgOutput), imgOutput + ' should be downloaded by img.get()');
  img.makeThumb(imgOutput, thumbOutput, thumbWidth, thumbHeight, function() {
    assert(fs.existsSync(thumbOutput), thumbOutput + ' should be created by img.makeThumb()');
    //console.log(imgOutput + ' thumb saved at ' + thumbOutput);
    fs.unlinkSync(imgOutput);
    fs.unlinkSync(thumbOutput);
  });
});
