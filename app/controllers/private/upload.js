//@ts-check

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

var defaultOptions = {
  keepOriginal: false,
  thumbDims: '180x', // image resize settings (optimized for profile/topic pictures)
};

/**
 * @param {{ filepath: string, mimetype:string, name: string }} file
 * @param {{ thumbDims?: string, keepOriginal?: boolean }} options
 */
function processFile(file, options, callback) {
  const { filepath, mimetype, name } = file ?? {};
  console.log(
    '[upload] processFile',
    { filepath, mimetype, name },
    { thumbDims: options.thumbDims, keepOriginal: options.keepOriginal },
  );
  if (!file || !filepath)
    return callback({ error: 'Error during file upload, please try again.' });
  else if (!mimetype || mimetype.indexOf('image/') != 0) {
    console.log('[upload] file is not an image => deleting file');
    uploadCtr.deleteFile(filepath).catch(/* nothing to do */);
    return callback({
      error: 'Only images are supported for upload, for now.',
    });
  } else {
    var result = {
      name: name,
      mime: mimetype,
      path: uploadCtr.cleanFilePath(filepath),
      thumbs: {},
    };

    var thumbDims = options.thumbDims ? options.thumbDims.split(',') : [];

    const whenDone = () => {
      console.log('[upload] done');
      if (!options.keepOriginal)
        uploadCtr.deleteFile(filepath).catch(/* nothing to do */);
      callback(result);
    };

    if (thumbDims.length > 0) {
      // create thumbs
      var f = uploadCtr.splitFilePath(filepath);
      var genThumb = function (thumbWidth, thumbHeight, callback) {
        var dims = (thumbWidth || '') + 'x' + (thumbHeight || '');
        var newPath = f.prefix + '_' + dims + f.ext;
        img.makeThumb(filepath, newPath, thumbWidth, thumbHeight, function () {
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
          console.log('[upload] generated thumb', { thumbDim, thumbFile });
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
  if (!user) return; // Note: we may want to send a response in that case too

  var postParams = req.body;
  var files = req.files;
  console.log('[upload] postParams', postParams);

  if (postParams && postParams.id && postParams.action == 'delete') {
    return uploadCtr
      .deleteFile(settings.uploadDir + '/' + postParams.id)
      .catch((err) => console.log(err, err.stack));
    // Note: we may want to send a response in that case too
  }

  var results = {},
    remaining = Object.keys(files).length;

  var options = {};
  for (let i in defaultOptions) options[i] = defaultOptions[i];
  for (let i in postParams) options[i] = postParams[i];

  var processAndPushFile = function (i) {
    processFile(files[i], options, function (result) {
      results[i] = result;
      if (--remaining == 0) {
        console.log('[upload] controller completed', result);
        res.legacyRender(results, null, { 'content-type': 'text/plain' });
      }
    });
  };

  for (let i in files) processAndPushFile(i);
};
