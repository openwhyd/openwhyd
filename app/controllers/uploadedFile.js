var fs = require('fs');
var mkdirp = require('mkdirp');
//var util = require('util');
var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var postModel = require('../models/post.js');
var userModel = require('../models/user.js');

var uploadRoot = config.paths.uploadRoot; // "./uploads"

exports.config = {
  uploadSubDir: '/' + config.paths.uploadDirName, // "/upload_data"
  uAvatarImgDir: '/' + config.paths.uAvatarImgDirName, // "/uAvatarImg"
  uCoverImgDir: '/' + config.paths.uCoverImgDirName,
  uPlaylistDir: '/' + config.paths.uPlaylistDirName
};

exports.config.uploadPath = uploadRoot + exports.config.uploadSubDir;
exports.config.uAvatarImgPath = uploadRoot + exports.config.uAvatarImgDir;
exports.config.uCoverImgPath = uploadRoot + exports.config.uCoverImgDir;
exports.config.uPlaylistPath = uploadRoot + exports.config.uPlaylistDir;

// create upload dirs
var dirMode = 0755;
var dirsToCreate = [
  exports.config.uploadPath,
  exports.config.uAvatarImgPath,
  exports.config.uCoverImgPath,
  exports.config.uPlaylistPath
];
for (var i in dirsToCreate)
  try {
    mkdirp.sync(dirsToCreate[i]);
    console.log('Created directory:', dirsToCreate[i]);
  } catch (e) {
    console.error('Did not create directory:', dirsToCreate[i], 'cause:', e);
  }

// separate file prefix (path & name) and extension from file.path
exports.splitFilePath = function(filepath) {
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
    ext: ext
  };
};

// transforms a fs filepath into a web/url path
exports.cleanFilePath = function(filepath) {
  console.log('[cleanFilePath] from:', filepath);
  var res = filepath.replace(uploadRoot, '');
  /*
    .replace(config.paths.uploadDirName, 'upload_data')
    .replace(config.paths.uAvatarImgDirName, 'uAvatarImg')
    .replace(config.paths.uCoverImgDirName, 'uCoverImg')
    .replace(config.paths.uPlaylistDirName, 'uPlaylistImg');
    */
  console.log('[cleanFilePath] to:', res);
  return res;
};

// transforms a web/url path into a fs filepath
exports.actualFilePath = function(filepath) {
  if (
    !filepath ||
    filepath.indexOf(uploadRoot) ==
      0 /*||
    filepath.indexOf(config.paths.uploadDirName) == 0 ||
    filepath.indexOf(config.paths.uAvatarImgDirName) == 0 ||
    filepath.indexOf(config.paths.uCoverImgDirName) == 0 ||
    filepath.indexOf(config.paths.uPlaylistDirName) == 0*/
  ) {
    return filepath;
  } else {
    console.log('[actualFilePath] from:', filepath);
    /*
    filepath = filepath
      .replace('upload_data', config.paths.uploadDirName)
      .replace('uAvatarImg', config.paths.uAvatarImgDirName)
      .replace('uCoverImg', config.paths.uCoverImgDirName)
      .replace('uPlaylistImg', config.paths.uPlaylistDirName);
      */
    filepath = uploadRoot + (filepath[0] != '/' ? '/' : '') + filepath;
    console.log('[actualFilePath] to:', filepath);
    return filepath;
  }
};

exports.deleteFile = function(filepath) {
  try {
    var filepath = exports.actualFilePath(filepath);
    console.log('deleting ' + filepath);
    fs.unlinkSync(filepath);
  } catch (e) {
    console.log(e, e.stack);
  }
};

exports.renameTo = function(filename, toFilename, callback) {
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
    fs.rename(actualFilename, actualToFilename, function() {
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

exports.moveTo = function(filename, toPath, callback) {
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

exports.controller = function(request, reqParams, response) {
  function renderNoImage() {
    response.renderFile(config.paths.whydPath + '/public/images/no_image.png');
  }

  function renderFile(path, defaultImg) {
    console.log('uploadedFile Path:', path);
    var filepath = exports.actualFilePath('' + path);
    console.log('actualFilePath Path:', filepath);
    response.renderFile(filepath, null, null, function(error) {
      //console.log("uploadedFile error: ", error, config.paths.whydPath + "/public" + defaultImg);
      if (defaultImg)
        response.renderFile(
          config.paths.whydPath + '/public' + defaultImg,
          null,
          null,
          renderNoImage
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
    userCover: function(id) {
      if (id.indexOf('.') > -1)
        return renderFile(
          exports.config.uCoverImgPath + '/' + id,
          '/images/1x1-pixel.png'
        );
      userModel.fetchByUid(id, function(user) {
        if (user && user.cvrImg) {
          var args = request.url.indexOf('?');
          response.temporaryRedirect(
            user.cvrImg + (args > -1 ? request.url.substr(args) : '')
          );
        } else renderFile(exports.config.uCoverImgPath + '/' + id, '/images/1x1-pixel.png');
      });
    },
    post: function(id) {
      postModel.fetchPostById(id, function(post) {
        renderImg((post || {}).img);
      });
    },
    playlist: function(id, reqParams) {
      var filePath = exports.config.uPlaylistPath + '/' + id;
      function renderLastPostImg() {
        var parts = ('' + id).split('_');
        postModel.fetchPlaylistPosts(parts[0], parts[1], { limit: 1 }, function(
          posts
        ) {
          for (var i in posts) {
            var img = (posts[i] || {}).img;
            if (img) {
              renderImg(img);
              return;
            }
          }
          renderImg();
        });
      }
      if (reqParams.remoteOnly)
        fs.stat(filePath, function(error, stats) {
          if (error || !stats.isFile()) renderLastPostImg();
          else renderImg(config.urlPrefix + '/images/1x1-pixel.png'); // transparent image
        });
      else
        response.renderFile(filePath, null, null, function(error) {
          if (reqParams.localOnly)
            renderImg(config.urlPrefix + '/images/1x1-pixel.png');
          // transparent image
          else renderLastPostImg();
        });
    }
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
