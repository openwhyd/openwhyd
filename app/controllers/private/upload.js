//@ts-check

/**
 * Upload controller
 * @author jie, whyd
 * @author adrienjoly, whyd
 */

//var formidable = require('formidable');
const fs = require('fs');
const path = require('path');
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

// error messages returned to the user => must not contain technical details
const ERR_UPLOAD_FAILED = 'Error during file upload, please try again.';
const ERR_NOT_AN_IMAGE = 'Only images are supported for upload, for now.';
const ERR_IMAGE_PROCESSING =
  'This image could not be processed. Please try another one.';

/**
 * @param {{ filepath: string, mimetype:string, name: string }} file
 * @param {{ thumbDims?: string, uId: string }} options
 */
function processFile(file, options, callback) {
  const { filepath, mimetype, name } = file ?? {};
  const { uId } = options;
  console.log(
    '[upload] processFile',
    { filepath, mimetype, name, uId },
    { thumbDims: options.thumbDims },
  );
  if (!file || !filepath) {
    console.warn('[upload] no file received', { uId });
    return callback({ error: ERR_UPLOAD_FAILED });
  } else if (!mimetype || !mimetype.startsWith('image/')) {
    console.warn(`[upload] rejected non-image file`, { mimetype, name, uId });
    uploadCtr.deleteFile(filepath).catch(() => {});
    return callback({ error: ERR_NOT_AN_IMAGE });
  } else {
    const result = {
      name: name,
      mime: mimetype,
      path: uploadCtr.cleanFilePath(filepath),
      thumbs: {},
    };

    const thumbDims = options.thumbDims ? options.thumbDims.split(',') : [];
    const thumbFiles = [];
    let thumbError = null;

    const whenDone = () => {
      console.log('[upload] done');
      uploadCtr.deleteFile(filepath).catch(() => {});
      if (thumbError || !thumbDims.length) {
        // note: without thumbs, the original file is deleted => nothing can be used
        if (thumbError)
          console.warn(
            `[upload] image could not be processed => rejected`,
            { mimetype, name, uId },
            `${thumbError.message ?? thumbError}`.replace(/\s+/g, ' '),
          );
        thumbFiles.forEach((f) => uploadCtr.deleteFile(f).catch(() => {}));
        callback({
          error: thumbError ? ERR_IMAGE_PROCESSING : ERR_UPLOAD_FAILED,
        });
      } else callback(result);
    };

    if (thumbDims.length > 0) {
      // create thumbs, named after the uploader, so that only they can use them
      const f = uploadCtr.splitFilePath(filepath);
      const genThumb = function (thumbWidth, thumbHeight, callback) {
        const dims = (thumbWidth || '') + 'x' + (thumbHeight || '');
        const newPath =
          f.path +
          uploadCtr.makeUploadedFileName(uId, f.prefix) +
          '_' +
          dims +
          f.ext;
        img.makeThumb(
          filepath,
          newPath,
          thumbWidth,
          thumbHeight,
          function (error) {
            if (!error && !fs.existsSync(newPath))
              error = new Error(`thumb was not created: ${newPath}`);
            if (callback) callback(error, newPath);
          },
        );
      };

      let remaining = thumbDims.length;
      for (const thumbDim of thumbDims) {
        const thumbWidthHeight = thumbDim.split('x');
        const thumbWidth =
          thumbWidthHeight.length > 0 ? thumbWidthHeight[0] : null;
        const thumbHeight =
          thumbWidthHeight.length > 1 ? thumbWidthHeight[1] : null;
        genThumb(thumbWidth, thumbHeight, function (error, thumbFile) {
          console.log('[upload] generated thumb', { thumbDim, thumbFile });
          thumbFiles.push(thumbFile);
          if (error) thumbError = thumbError || error;
          result.thumbs[thumbDim] = uploadCtr.cleanFilePath(thumbFile);
          result.path = result.thumbs[thumbDim];
          if (--remaining === 0) whenDone();
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
    // users can only delete files that they uploaded
    const filepath =
      typeof postParams.id === 'string'
        ? settings.uploadDir + '/' + path.basename(postParams.id)
        : null;
    if (!filepath || !uploadCtr.isUploadedBy(user.id, filepath)) {
      console.warn('[upload] denied deletion of file', {
        id: postParams.id,
        uId: user.id,
      });
      return res.renderJSON({ error: 'File not found.' }, 404);
    }
    return uploadCtr.deleteFile(filepath).then(
      () => res.renderJSON({ ok: 1 }),
      (err) => {
        console.warn(`[upload] failed to delete ${filepath}: ${err.message}`);
        res.renderJSON({ error: 'File not found.' }, 404);
      },
    );
  }

  const results = {};
  let remaining = Object.keys(files ?? {}).length;
  if (!remaining) return res.renderJSON({ error: ERR_UPLOAD_FAILED }); // status 200, for compatibility with WhydImgUpload

  /** @type {Record<string, any>} */
  const clientOptions = { ...defaultOptions };
  for (const i in postParams) clientOptions[i] = postParams[i];
  const options = {
    thumbDims: clientOptions.thumbDims,
    uId: user.id, // must not be overridable by the client
  };

  const processAndPushFile = function (i) {
    processFile(files[i], options, function (result) {
      results[i] = result;
      if (--remaining === 0) {
        console.log('[upload] controller completed', result);
        res.legacyRender(results, null, { 'content-type': 'text/plain' });
      }
    });
  };

  for (const i in files) processAndPushFile(i);
};
