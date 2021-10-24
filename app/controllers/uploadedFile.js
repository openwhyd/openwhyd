var fs = require('fs');
var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');
var userModel = require('../models/user.js');

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
var dirMode = 0o755;
var dirsToCreate = [
  exports.config.uploadPath,
  exports.config.uAvatarImgPath,
  exports.config.uCoverImgPath,
  exports.config.uPlaylistPath,
];
for (let i in dirsToCreate)
  try {
    fs.mkdirSync(dirsToCreate[i], dirMode);
    console.log('Created directory:', dirsToCreate[i]);
  } catch (e) {
    //console.log("Did not create directory:", dirsToCreate[i]);
  }

// separate file prefix (path & name) and extension from file.path
exports.splitFilePath = function (filepath) {
  var path = filepath.split('/');
  var name = path.pop();
  path = path.length > 0 ? path.join('/') + '/' : '';
  var prefix = name.split('.');
  var ext = prefix.length > 1 ? '.' + prefix.pop() : '';
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

exports.actualFilePath = function (filepath) {
  if (!filepath || filepath.indexOf(exports.config.whydPath) == 0)
    return filepath;
  else
    return (filepath =
      exports.config.whydPath + (filepath[0] != '/' ? '/' : '') + filepath);
};

exports.deleteFile = function (_filepath) {
  const filepath = exports.actualFilePath(_filepath);
  console.log('deleting ' + filepath);
  return fs.promises
    .unlink(filepath)
    .catch((err) => console.log(err, err.stack));
};

exports.renameTo = function (filename, toFilename, callback) {
  //console.log("uploadedFile.renameTo", filename, toFilename);
  function error(e) {
    if (callback) callback();
    console.log('ERROR:', e);
  }
  if (!filename || !toFilename)
    return error(
      'invalid filename or toFilename: ' + filename + ', ' + toFilename
    );
  try {
    var actualFilename = exports.actualFilePath(filename);
    var actualToFilename = exports.actualFilePath(toFilename);
    console.log('renaming/moving', actualFilename, 'to', actualToFilename);
    fs.rename(actualFilename, actualToFilename, function () {
      callback && callback(toFilename);
    });
    /*
		var is = fs.createReadStream(actualFilename)
		var os = fs.createWriteStream(actualToFilename);
		util.pump(is, os, function(x) {
			console.log("result", x);
			exports.deleteFile(filename);
			if (callback)
				callback(toFilename);
		});
		*/
  } catch (e) {
    error(e);
  }
};

exports.moveTo = function (filename, toPath, callback) {
  //console.log("uploadedFile.moveTo", filename, toPath);
  if (!filename || !toPath) {
    if (callback) callback();
    console.log(
      'ERROR: invalid filename or toPath: ' + filename + ', ' + toPath
    );
    return filename;
  }
  var newFilename = toPath + '/' + filename.split('/').pop();
  exports.renameTo(filename, newFilename, callback);
  return newFilename;
};

exports.controller = function (request, reqParams, response) {
  function renderNoImage() {
    response.sendFile(NO_IMAGE_PATH);
  }

  function renderFile(path, defaultImg) {
    //console.log("uploadedFile Path:", path);
    response.sendFile('' + path, function (error) {
      if (!error) return;
      //console.log("uploadedFile error: ", error, exports.config.whydPath + "/public" + defaultImg);
      if (defaultImg)
        response.sendFile(
          exports.config.whydPath + '/public' + defaultImg,
          (err) => err && renderNoImage()
        );
      else renderNoImage();
    });
  }

  function renderImg(uri, defaultImg) {
    if (uri && ('' + uri).indexOf('//') != -1) {
      var args = request.url.indexOf('?');
      response.temporaryRedirect(
        uri.replace('http:', '') + (args > -1 ? request.url.substr(args) : '')
      );
    } else renderFile(uri, defaultImg);
  }

  function renderUserImg(id) {
    var user = mongodb.usernames[id];
    if (user && user.img) {
      //var isSmallFb = user.img.indexOf("graph.facebook.com") > -1 && user.img.split("/").pop() == "picture";
      //console.log(user.img, isSmallFb, user.img + (isSmallFb ? "?type=large" : ""));
      //response.temporaryRedirect(user.img + (isSmallFb ? "?type=large" : ""));
      var args = request.url.indexOf('?');
      response.temporaryRedirect(
        user.img.replace('http:', '') +
          (args > -1 ? request.url.substr(args) : '')
      );
    } else
      renderFile(
        exports.config.uAvatarImgPath + '/' + id,
        '/images/blank_user.gif'
      );
  }

  var renderTypedImg = {
    u: renderUserImg,
    user: renderUserImg,
    userCover: function (id) {
      if (id.indexOf('.') > -1)
        return renderFile(
          exports.config.uCoverImgPath + '/' + id,
          '/images/1x1-pixel.png'
        );
      userModel.fetchByUid(id, function (user) {
        if (user && user.cvrImg) {
          var args = request.url.indexOf('?');
          response.temporaryRedirect(
            user.cvrImg + (args > -1 ? request.url.substr(args) : '')
          );
        } else renderFile(exports.config.uCoverImgPath + '/' + id, '/images/1x1-pixel.png');
      });
    },
    post: function (id) {
      postModel.fetchPostById(id, function (post) {
        renderImg((post || {}).img || NO_IMAGE_PATH);
      });
    },
    playlist: function (id, reqParams) {
      var filePath = exports.config.uPlaylistPath + '/' + id;
      function renderLastPostImg() {
        var parts = ('' + id).split('_');
        postModel.fetchPlaylistPosts(
          parts[0],
          parts[1],
          { limit: 1 },
          function (posts) {
            for (let i in posts) {
              var img = (posts[i] || {}).img;
              if (img) {
                renderImg(img);
                return;
              }
            }
            response.notFound();
          }
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
  if (reqParams.id) {
    if (reqParams.type && renderTypedImg[reqParams.type])
      renderTypedImg[reqParams.type](reqParams.id, reqParams);
    else renderFile(exports.config.uploadPath + '/' + reqParams.id);
  } else if (reqParams.uAvatarImg) renderTypedImg['user'](reqParams.uAvatarImg);
  else if (reqParams.uCoverImg)
    renderTypedImg['userCover'](reqParams.uCoverImg);
  else response.badRequest();
};
