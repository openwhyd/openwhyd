//@ts-check

/**
 * Upload controller
 * @author jie, whyd
 * @author adrienjoly, whyd
 */

//var formidable = require('formidable');
const img = require('../../lib/my-img');
const uploadCtr = require('../uploadedFile.js');

// hosting settings
const settings = {
  uploadDir: uploadCtr.config.uploadPath, //'../upload_data',
  keepExtensions: true,
};

const defaultOptions = {
  keepOriginal: false,
  thumbDims: '180x', // image resize settings (optimized for profile/topic pictures)
};

/**
 * @param {{ filepath: string, mimetype:string, name: string }} file
 * @param {{ thumbDims?: string}} options
 */
function processFile(file, options, callback) {
  const { filepath, mimetype, name } = file ?? {};
  console.log(
    '[upload] processFile',
    { filepath, mimetype, name },
    { thumbDims: options.thumbDims },
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
    const result = {
      name: name,
      mime: mimetype,
      path: uploadCtr.cleanFilePath(filepath),
      thumbs: {},
    };

    const thumbDims = options.thumbDims ? options.thumbDims.split(',') : [];

    const whenDone = () => {
      console.log('[upload] done');
      uploadCtr.deleteFile(filepath).catch(/* nothing to do */);
      callback(result);
    };

    if (thumbDims.length > 0) {
      // create thumbs
      const f = uploadCtr.splitFilePath(filepath);
      const genThumb = function (thumbWidth, thumbHeight, callback) {
        const dims = (thumbWidth || '') + 'x' + (thumbHeight || '');
        const newPath = f.prefix + '_' + dims + f.ext;
        img.makeThumb(filepath, newPath, thumbWidth, thumbHeight, function () {
          if (callback) callback(newPath, thumbWidth, thumbHeight, dims);
        });
      };

      let remaining = thumbDims.length; //thumbWidths.length;
      for (const i in thumbDims) {
        var thumbDim = thumbDims[i];
        const thumbWidthHeight = thumbDim.split('x');
        const thumbWidth =
          thumbWidthHeight.length > 0 ? thumbWidthHeight[0] : null;
        const thumbHeight =
          thumbWidthHeight.length > 1 ? thumbWidthHeight[1] : null;
        genThumb(thumbWidth, thumbHeight, function (thumbFile) {
          console.log('[upload] generated thumb', { thumbDim, thumbFile });
          result.thumbs[/*dims*/ thumbDim] = uploadCtr.cleanFilePath(thumbFile);
          result.path = result.thumbs[/*dims*/ thumbDim];
          if (--remaining == 0) whenDone();
        });
      }
    } else whenDone();

    return result;
  }
}

exports.controller = async function (req, requestParams, res) {
  req.logToConsole('upload.controller', requestParams);

  const user = await req.checkLogin(res);
  if (!user) return; // Note: we may want to send a response in that case too

  const postParams = req.body;
  const files = req.files;
  console.log('[upload] postParams', postParams);

  if (postParams && postParams.id && postParams.action == 'delete') {
    return uploadCtr
      .deleteFile(settings.uploadDir + '/' + postParams.id)
      .catch((err) => console.log(err, err.stack));
    // Note: we may want to send a response in that case too
  }

  const results = {};
  let remaining = Object.keys(files).length;

  const options = {};
  for (const i in defaultOptions) options[i] = defaultOptions[i];
  for (const i in postParams) options[i] = postParams[i];

  const processAndPushFile = function (i) {
    processFile(files[i], options, function (result) {
      results[i] = result;
      if (--remaining == 0) {
        console.log('[upload] controller completed', result);
        res.legacyRender(results, null, { 'content-type': 'text/plain' });
      }
    });
  };

  for (const i in files) processAndPushFile(i);
};
