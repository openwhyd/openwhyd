require.paths.unshift(__dirname + '/lib');
var img = require('my/img');

var imgUrl = 'http://www.azurs.net/photographies/laurier-rose-fleur-rebigue.jpg';
var imgOutput = 'uniqueHash.jpg';
var thumbOutput = 'uniqueHash_thumb.jpg';
var thumbWidth = null; // auto-scaling
var thumbHeight = 80;


img.get(imgUrl, imgOutput, function() {
  img.makeThumb(imgOutput, thumbOutput, thumbWidth, thumbHeight, function() {
    console.log(imgOutput + ' thumb saved at ' + thumbOutput);
  });
});

