const fs = require('fs');
const path = require('path');
const config = require('../models/config.js');
const postModel = require('../models/post.js');
const { isObjectId } = require('../models/mongodb.js');
const userModel = require('../models/user.js');

exports.config = {
  whydPath: config.paths.whydPath, // "../"
  uploadSubDir: '/' + config.paths.uploadDirName, // "/upload_data"
  uAvatarImgDir: '/' + config.paths.uAvatarImgDirName, // "/uAvatarImg"
  uCoverImgDir: '/' + config.paths.uCoverImgDirName,
  uPlaylistDir: '/' + config.paths.uPlaylistDirName,
};

exports.config.uploadPath =
  exports.config.whydPath + exports.config.uploadSubDir;
exports.config.uAvatarImgPath =
  exports.config.whydPath + exports.config.uAvatarImgDir;
exports.config.uCoverImgPath =
  exports.config.whydPath + exports.config.uCoverImgDir;
exports.config.uPlaylistPath =
  exports.config.whydPath + exports.config.uPlaylistDir;

const NO_IMAGE_PATH = exports.config.whydPath + '/public/images/no_image.png';

// create upload dirs
const dirMode = 0o755;
const dirsToCreate = [
  exports.config.uploadPath,
  exports.config.uAvatarImgPath,
  exports.config.uCoverImgPath,
  exports.config.uPlaylistPath,
];
for (const i in dirsToCreate)
  try {
    fs.mkdirSync(dirsToCreate[i], dirMode);
    console.log('Created directory:', dirsToCreate[i]);
  } catch (e) {
    //console.log("Did not create directory:", dirsToCreate[i]);
  }

// files can only be read, moved or deleted from these directories
const userDataDirs = dirsToCreate.map((dir) => path.resolve(dir) + path.sep);
// files can only be moved from this directory (i.e. freshly uploaded files)
const uploadDirs = [path.resolve(exports.config.uploadPath) + path.sep];

exports.getPlaylistImagePath = ({ uId, id }) =>
  exports.config.uPlaylistDir + '/' + uId + '_' + id;

// separate file prefix (path & name) and extension from file.path
exports.splitFilePath = function (filepath) {
  let path = filepath.split('/');
  const name = path.pop();
  path = path.length > 0 ? path.join('/') + '/' : '';
  let prefix = name.split('.');
  const ext = prefix.length > 1 ? '.' + prefix.pop() : '';
  prefix = path + prefix.join('.'); // path + filename without extension
  return {
    filepath: filepath,
    prefix: prefix,
    path: path,
    name: name,
    ext: ext,
  };
};

exports.cleanFilePath = function (filepath) {
  return filepath.replace(exports.config.whydPath, '');
};

/**
 * @param {string} filepath
 * @param {string[]} [allowedDirs] absolute paths, ending with a path separator
 * @returns {string} the resolved absolute path of the file
 * @throws if the file is not located in one of the allowed directories
 */
exports.actualFilePath = function (filepath, allowedDirs = userDataDirs) {
  if (typeof filepath !== 'string' || !filepath)
    throw new Error(`invalid file path: ${filepath}`);
  const actualPath =
    filepath.indexOf(exports.config.whydPath) === 0
      ? filepath
      : exports.config.whydPath + (filepath[0] != '/' ? '/' : '') + filepath;
  const resolvedPath = path.resolve(actualPath);
  if (!allowedDirs.some((dir) => resolvedPath.startsWith(dir)))
    throw new Error(`file path is not in an allowed directory: ${filepath}`);
  return resolvedPath;
};

exports.deleteFile = async function (_filepath) {
  const filepath = exports.actualFilePath(_filepath);
  console.log('deleting ' + filepath);
  return fs.promises.unlink(filepath);
};

/**
 * Moves a freshly uploaded file (must be in the upload directory) to a user data directory.
 * If the rename fails, the original file will be deleted to avoid leaving it behind.
 * @param {string} filename
 * @param {string} toFilename
 * @param {(err: Error|null, newFilename?: string) => void} callback
 */
exports.renameTo = function (filename, toFilename, callback) {
  function error(e) {
    console.trace('renameTo ERROR:', e);
    if (callback) callback(e);
  }
  if (!filename || !toFilename)
    return error(
      'invalid filename or toFilename: ' + filename + ', ' + toFilename,
    );
  try {
    const actualFilename = exports.actualFilePath(filename, uploadDirs);
    const actualToFilename = exports.actualFilePath(toFilename);
    console.log('renaming/moving', actualFilename, 'to', actualToFilename);

    // Copy+delete instead of rename, so it works across different filesystems too
    fs.copyFile(actualFilename, actualToFilename, (err) => {
      if (err) {
        error(err);
      } else {
        callback?.(null, toFilename);
      }
      // in both cases, don't leave the uploaded file behind
      exports.deleteFile(actualFilename).catch(() => {});
    });
  } catch (e) {
    error(e);
  }
};

/**
 * @param {string} filename
 * @param {string} toPath
 * @param {(err: Error|null, newFilename?: string) => void} callback
 */
exports.moveTo = function (filename, toPath, callback) {
  //console.log("uploadedFile.moveTo", filename, toPath);
  if (!filename || !toPath) {
    console.log(
      'ERROR: invalid filename or toPath: ' + filename + ', ' + toPath,
    );
    callback?.(new Error(`invalid filename or toPath: ${filename}, ${toPath}`));
    return filename;
  }
  const newFilename = toPath + '/' + filename.split('/').pop();
  exports.renameTo(filename, newFilename, callback);
  return newFilename;
};

exports.controller = async function (request, reqParams, response) {
  function renderNoImage() {
    response.status(404).sendFile(NO_IMAGE_PATH);
  }

  function renderFileOrDefault(path, defaultImg) {
    response.sendFile('' + path, function (error) {
      if (!error) return;
      if (defaultImg) {
        const defaultImagePath =
          exports.config.whydPath + '/public' + defaultImg;
        response.status(404).sendFile(defaultImagePath, (err) => {
          if (!err) return;
          renderNoImage();
        });
      } else {
        renderNoImage();
      }
    });
  }

  function renderImg(uri, defaultImg) {
    if (uri && ('' + uri).indexOf('//') != -1) {
      const args = request.url.indexOf('?');
      response.temporaryRedirect(
        uri.replace('http:', '') + (args > -1 ? request.url.substr(args) : ''),
      );
    } else renderFileOrDefault(uri, defaultImg);
  }

  /**
   * @param {string} id - can be a userId or an image name, e.g. "<userId>_<nbpixels>px"
   */
  async function renderUserImg(id) {
    const user = isObjectId(id)
      ? await userModel.fetchAndProcessUserById(id)
      : null;
    if (user && user.img) {
      //var isSmallFb = user.img.indexOf("graph.facebook.com") > -1 && user.img.split("/").pop() == "picture";
      //console.log(user.img, isSmallFb, user.img + (isSmallFb ? "?type=large" : ""));
      //response.temporaryRedirect(user.img + (isSmallFb ? "?type=large" : ""));
      const args = request.url.indexOf('?');
      response.temporaryRedirect(
        user.img.replace('http:', '') +
          (args > -1 ? request.url.substr(args) : ''),
      );
    } else
      renderFileOrDefault(
        exports.config.uAvatarImgPath + '/' + id,
        '/images/blank_user.gif',
      );
  }

  const renderTypedImg = {
    u: renderUserImg,
    user: renderUserImg,
    userCover: function (filename) {
      return renderFileOrDefault(
        exports.config.uCoverImgPath + '/' + filename,
        '/images/1x1-pixel.png',
      );
    },
    post: function (id) {
      postModel.fetchPostById(id, function (post) {
        renderImg((post || {}).img || NO_IMAGE_PATH);
      });
    },
    playlist: function (id, reqParams) {
      const filePath = exports.config.uPlaylistPath + '/' + id;
      function renderLastPostImg() {
        const parts = ('' + id).split('_');
        postModel.fetchPlaylistPosts(
          parts[0],
          parts[1],
          { limit: 1 },
          function (posts) {
            for (const i in posts) {
              const img = (posts[i] || {}).img;
              if (img) {
                renderImg(img);
                return;
              }
            }
            response.notFound();
          },
        );
      }
      if (reqParams.remoteOnly)
        fs.stat(filePath, function (error, stats) {
          if (error || !stats.isFile()) renderLastPostImg();
          else renderImg(config.urlPrefix + '/images/1x1-pixel.png'); // transparent image
        });
      else
        response.sendFile(filePath, function (error) {
          if (!error) return;
          if (reqParams.localOnly)
            renderImg(config.urlPrefix + '/images/1x1-pixel.png');
          // transparent image
          else renderLastPostImg();
        });
    },
  };

  //request.logToConsole("uploadedFile.controller", request.method);
  reqParams = reqParams || {};
  try {
    if (reqParams.id) {
      if (reqParams.type && renderTypedImg[reqParams.type])
        await renderTypedImg[reqParams.type](reqParams.id, reqParams);
      else renderFileOrDefault(exports.config.uploadPath + '/' + reqParams.id);
    } else if (reqParams.uAvatarImg)
      await renderTypedImg['user'](reqParams.uAvatarImg);
    else if (reqParams.uCoverImg)
      renderTypedImg['userCover'](reqParams.uCoverImg);
    else response.badRequest();
  } catch (err) {
    renderNoImage();
  }
};
