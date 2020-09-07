/**
 * Upload controller
 * @author jie, whyd
 * @author adrienjoly, whyd
 */

//var formidable = require('formidable');
var img = require('../../lib/my-img');
var uploadCtr = require('../uploadedFile.js');

// hosting settings
var settings = {
  uploadDir: uploadCtr.config.uploadPath, //'../upload_data',
  keepExtensions: true,
};

var defaults = {
  keepOriginal: false,
  thumbDims: '180x', // image resize settings (optimized for profile/topic pictures)
};

function processFile(file, options, callback) {
  console.log('processFile', file, options);
  if (!file || !file.path)
    return callback({ error: 'Error during file upload, please try again.' });
  else if (!file.type || file.type.indexOf('image/') != 0) {
    console.log('uploaded a file that is not an image => deleting file');
    uploadCtr.deleteFile(file.path);
    return callback({
      error: 'Only images are supported for upload, for now.',
    });
  } else {
    var result = {
      name: file.name,
      mime: file.type,
      path: uploadCtr.cleanFilePath(file.path),
      thumbs: {},
    };

    var thumbDims = options.thumbDims ? options.thumbDims.split(',') : [];

    console.log('thumbDims', thumbDims);

    const whenDone = () => {
      console.log('whendone');
      if (!options.keepOriginal) uploadCtr.deleteFile(file.path);
      callback(result);
    };

    if (thumbDims.length > 0) {
      // create thumbs
      var f = uploadCtr.splitFilePath(file.path);
      var genThumb = function (thumbWidth, thumbHeight, callback) {
        var dims = (thumbWidth || '') + 'x' + (thumbHeight || '');
        var newPath = f.prefix + '_' + dims + f.ext;
        img.makeThumb(file.path, newPath, thumbWidth, thumbHeight, function () {
          if (callback) callback(newPath, thumbWidth, thumbHeight, dims);
        });
      };

      var remaining = thumbDims.length; //thumbWidths.length;
      for (let i in thumbDims) {
        var thumbDim = thumbDims[i];
        var thumbWidthHeight = thumbDim.split('x');
        var thumbWidth =
          thumbWidthHeight.length > 0 ? thumbWidthHeight[0] : null;
        var thumbHeight =
          thumbWidthHeight.length > 1 ? thumbWidthHeight[1] : null;
        genThumb(thumbWidth, thumbHeight, function (thumbFile) {
          console.log('generated thumb', thumbDim, thumbFile);
          result.thumbs[/*dims*/ thumbDim] = uploadCtr.cleanFilePath(thumbFile);
          if (!options.keepOriginal)
            result.path = result.thumbs[/*dims*/ thumbDim];
          if (--remaining == 0) whenDone();
        });
      }
    } else whenDone();

    return result;
  }
}

exports.controller = function (req, requestParams, res) {
  req.logToConsole('upload.controller', requestParams);

  var user = req.checkLogin(res);
  if (!user) return;

  //var form = new formidable.IncomingForm();
  //form.uploadDir = settings.uploadDir;
  //form.keepExtensions = settings.keepExtensions;
  //form.parse(req, function(err, postParams, files) {
  var postParams = req.body;
  var files = req.files;
  console.log('postParams', postParams);
  //if (err) {
  //	console.log("upload.controller error", err.stack);
  //	return res.legacyRender({error:err});
  //}

  if (postParams && postParams.id && postParams.action == 'delete')
    return uploadCtr.deleteFile(settings.uploadDir + '/' + postParams.id);

  console.log('upload.controller completed', files);
  var results = {},
    remaining = Object.keys(files).length;

  var options = {};
  for (let i in defaults) options[i] = defaults[i];
  for (let i in postParams) options[i] = postParams[i];

  var processAndPushFile = function (i) {
    processFile(files[i], options, function (result) {
      if (result && result.error) console.log(result.error);
      results[i] = result;
      if (--remaining == 0) {
        console.log('upload.controller completed', result);
        res.legacyRender(results, null, { 'content-type': 'text/plain' });
        /*
					res.writeHead(200, {'content-type': 'text/plain'});
					res.end('received upload\nreceived\n');*/
      }
    });
  };

  for (let i in files) processAndPushFile(i);
  //});
};
