var http = require('http');
var fs = require('fs');
var url = require('url');
var child_process = require('child_process');

var USE_GRAPHICS_MAGICK = true; // previously process.env.WHYD_USE_GRAPHICS_MAGICK

// returns a version string from cmd's stdout, or undefined if cmd could not be run
function getVersion(cmd) {
  try {
    return child_process.execSync(cmd).toString().split('\n')[0];
  } catch (e) {
    // let the function return undefined
  }
}

// detect graphicsmagick
var gmVersion = getVersion('gm -version');
if (gmVersion) {
  console.log('[my.img] detected', gmVersion);
} else {
  USE_GRAPHICS_MAGICK = false;
  var imVersion = getVersion('convert --version');
  if (imVersion) {
    console.log(
      '[my.img] detected',
      imVersion,
      '=> using it for image manipulation'
    );
  } else {
    console.error(
      '[my.img] ERROR: please install graphicsmagick or imagemagick for image manipulation.'
    );
  }
}

exports.get = function (imgUrl, imgOutput, endListener, errorListener) {
  imgUrl = url.parse(imgUrl);
  http.get(
    { host: imgUrl.host, path: imgUrl.pathname, port: 80 },
    function (res) {
      var data = '';
      res.setEncoding('binary');
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        console.log('[my.img] done');
        fs.writeFile(imgOutput, data, 'binary', function (err) {
          if (err) {
            if (errorListener) errorListener(err);
            else console.error('[my.img]', err);
          } else if (endListener) endListener();
        });
      });
    }
  );
};

if (USE_GRAPHICS_MAGICK) {
  var gm = require('./node-magick');
  exports.makeThumb = function (
    imgPath,
    thumbOutput,
    width,
    height,
    endListener
  ) {
    gm.createCommand(imgPath)
      .resize(width || '', height || '')
      .write(thumbOutput, function () {
        if (endListener) endListener();
      });
  };
} else {
  var exec = child_process.exec;
  exports.makeThumb = function (
    imgPath,
    thumbOutput,
    width,
    height,
    endListener
  ) {
    var execCallback = function (error, stdout, stderr) {
      console.log('[my.img] exec convert => ', error, stdout, stderr);
      if (endListener) endListener(error, stdout, stderr);
    };
    if (width && height)
      exec(
        'convert ' +
          imgPath +
          ' -resize ' +
          width +
          'x' +
          height +
          ' ' +
          thumbOutput,
        execCallback
      );
    else if (width)
      exec(
        'convert ' + imgPath + ' -resize ' + width + ' ' + thumbOutput,
        execCallback
      );
    else if (height)
      exec(
        'convert ' + imgPath + ' -resize x' + height + ' ' + thumbOutput,
        execCallback
      );
  };
}
