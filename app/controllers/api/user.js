/**
 * user api
 * retrieve and update user info
 * @author adrienjoly, whyd
 */

// FOR TESTING:
// http://localhost:8080/admin/db/find.txt?col=user&pwd=ac0ddf9e65d57b6a56b2453386cd5db5
// http://localhost:8080/login?action=login&email=whydempty&md5=ac0ddf9e65d57b6a56b2453386cd5db5&format=json&ajax=1&includeUser=1
// http://localhost:8080/admin/db/find.txt?col=user&email=admin%2Btest@gmail.com
// POST http://localhost:8080/signup?email=admin%2Btest@gmail.com&password=coco&ajax=1&includeUser=1
// http://localhost:8080/api/user
// http://localhost:8080/admin/users?action=delete&_id=<...>

var snip = require('../../snip.js');
var mongodb = require('../../models/mongodb.js');
var postModel = require('../../models/post.js');
var userModel = require('../../models/user.js');
var uploadCtr = require('../uploadedFile.js');

// for when called through subdir controller
var SEQUENCED_PARAMETERS = { _1: 'id', _2: 'action' }; //[null, "id", "action"];

var publicActions = {
  delete: function (p, cb) {
    if (!p || !p.loggedUser || !p.loggedUser.id)
      cb({ error: 'Please log in first' });
    else {
      console.log('deleting user... ', p.loggedUser.id);
      userModel.delete({ _id: p.loggedUser.id }, function (r) {
        console.log('deleted user', p.loggedUser.id, r);
      });
      cb({
        ok: 1,
        message:
          'We are deleting your Openwhyd account. Sorry to see you leave...',
      });
    }
  },
  askAccountDeletion: function (p, cb) {
    if (!p || !p.loggedUser || !p.loggedUser.id)
      cb({ error: 'Please log in first' });
    else {
      cb({ ok: 1, message: 'Thank you, we will get back to you shortly.' });
    }
  },
};

function defaultSetter(fieldName) {
  return function (p, cb) {
    var u = { _id: p._id };
    u[fieldName.replace('_', '.')] = p[fieldName];
    userModel.save(u, cb);
  };
}

var fieldSetters = {
  name: function (p, cb) {
    userModel.renameUser(p._id, p.name, cb);
  },
  img: function (p, cb) {
    userModel.fetchByUid(p._id, function (user) {
      if (user.img && user.img.indexOf('blank_user.gif') == -1) {
        console.log('deleting previous profile pic: ' + user.img);
        uploadCtr.deleteFile(user.img);
      }
      function actualUpdate(newFilename) {
        defaultSetter('img')({ _id: p._id, img: newFilename || p.img }, cb);
      }
      if (p.img.indexOf('blank_user.gif') == -1)
        uploadCtr.moveTo(p.img, uploadCtr.config.uAvatarImgDir, actualUpdate);
      else actualUpdate(p.img);
    });
  },
  cvrImg: function (p, cb) {
    userModel.fetchByUid(p._id, function (user) {
      if (user.cvrImg && user.cvrImg.indexOf('blank') == -1) {
        console.log('deleting previous cover image: ' + user.cvrImg);
        uploadCtr.deleteFile(user.cvrImg);
      }
      function actualUpdate(newFilename) {
        defaultSetter('cvrImg')(
          { _id: p._id, cvrImg: newFilename || p.cvrImg },
          cb
        );
      }
      if (p.cvrImg.indexOf('blank') == -1)
        uploadCtr.moveTo(p.cvrImg, uploadCtr.config.uCoverImgDir, actualUpdate);
      else userModel.update(p._id, { $unset: { cvrImg: 1 } }, cb); // remove cvrImg attribute
    });
  },
  pwd: function (p, cb) {
    userModel.fetchByUid(p._id, function (item) {
      if (item && item.pwd == userModel.md5(p.oldPwd || '')) {
        defaultSetter('pwd')({ _id: p._id, pwd: userModel.md5(p.pwd) }, cb);
      } else cb({ error: 'Your current password is incorrect' });
    });
  },
  handle: function (p, cb) {
    userModel.setHandle(p._id, p.handle, cb);
  },
  email: function (p, cb) {
    userModel.fetchByEmail(p.email, function (existingUser) {
      if (!existingUser) {
        defaultSetter('email')(p, cb);
      } else if ('' + existingUser._id == p._id)
        // no change
        cb({ email: p.email });
      else cb({ error: 'This email already belongs to another user' });
    });
  },
  pref: function (p, cb) {
    // type each provided pref value accordingly to defaults. "true" boolean was translated to "1"
    for (let i in p.pref)
      p.pref[i] =
        typeof userModel.DEFAULT_PREF[i] == 'boolean'
          ? p.pref[i] == 1
          : p.pref[i];
    userModel.setPref(p._id, p.pref, cb);
  },
  twId: function (p, cb) {
    userModel.setTwitterId(p._id, p.twId, p.twTok, p.twSec, cb);
  },
  apTok: function (p, cb) {
    if (p.apTok === '') userModel.clearApTok(p._id, cb);
    else userModel.setApTok(p._id, p.apTok, cb);
  },
  //"fbId": defaultSetter("fbId"),
  bio: defaultSetter('bio'),
  loc: defaultSetter('loc'),
  lnk_home: defaultSetter('lnk_home'),
  lnk_fb: defaultSetter('lnk_fb'),
  lnk_tw: defaultSetter('lnk_tw'),
  lnk_sc: defaultSetter('lnk_sc'),
  lnk_yt: defaultSetter('lnk_yt'),
  lnk_igrm: defaultSetter('lnk_igrm'),
};

function countUserPosts(user, cb) {
  postModel.countUserPosts(user.id, function (res) {
    user.nbPosts = res;
    cb(user);
  });
}

function countUserLikes(user, cb) {
  postModel.countLovedPosts(user.id, function (res) {
    user.nbLikes = res;
    cb(user);
  });
}

exports.fetchUserData = function (user, cb) {
  var ops = [countUserPosts, countUserLikes];
  (function next() {
    if (!ops.length) cb(user);
    else ops.pop().apply(null, [user, next]);
  })();
};

function fetchUserById(uId, options, cb) {
  options = options || {};
  userModel.fetchByUid(uId, function (user) {
    user = user || {};
    userModel.fetchPlaylists(user, {}, function (playlists) {
      user.pl = playlists || user.pl;
      if (options.excludePrivateFields) {
        delete user.pwd;
        delete user.email;
        delete user.lastFm;
        delete user.pref;
        delete user.fbTok;
        delete user.apTok;
        delete user.twTok;
        delete user.twSec;
      }
      cb(user);
    });
  });
}

function fetchUserByIdOrHandle(uidOrHandle, options, cb) {
  function returnUser(u) {
    var uId = (u || {}).id;
    if (!uId) cb({ error: 'user not found' });
    else fetchUserById(uId, options, cb);
  }
  var u = mongodb.getUserFromId(uidOrHandle) || {};
  if (u.id) returnUser(u);
  else userModel.fetchByHandle(uidOrHandle, returnUser);
}

function handlePublicRequest(loggedUser, reqParams, localRendering) {
  // transforming sequential parameters to named parameters
  reqParams = snip.translateFields(reqParams, SEQUENCED_PARAMETERS);

  var handler = publicActions[reqParams.action];
  if (handler) {
    reqParams.loggedUser = loggedUser;
    handler(reqParams, localRendering);
    return true;
  } else if (reqParams.id) {
    reqParams.excludePrivateFields = true;
    fetchUserByIdOrHandle(reqParams.id, reqParams, function (u) {
      var tasks = [localRendering];
      if (reqParams.countPosts) tasks.push(countUserPosts);
      if (reqParams.countLikes) tasks.push(countUserLikes);
      (function next() {
        var fct = tasks.pop();
        fct && fct(u, next);
      })();
    });
    return true;
  }
}

function handleAuthRequest(loggedUser, reqParams, localRendering) {
  // make sure a registered user is logged, or return an error page
  if (false == loggedUser)
    return localRendering({ error: 'user not logged in' });

  reqParams._id = loggedUser._id;

  var toUpdate = [];
  for (let i in fieldSetters) if (reqParams[i] !== undefined) toUpdate.push(i);

  if (toUpdate.length) {
    var result = {};
    (function setNextField(prevResult) {
      if (prevResult)
        for (let i in prevResult) result[i] = prevResult[i] || result[i];
      if (!toUpdate.length) localRendering(result);
      else {
        var fieldName = toUpdate.pop();
        console.log('calling field setter: ', fieldName);
        reqParams._id = loggedUser._id; // force the logged user id
        fieldSetters[fieldName](reqParams, setNextField);
      }
    })();
  } else {
    fetchUserById(loggedUser._id, reqParams, localRendering);
  }
}

// old name: setUserFields()
function handleRequest(loggedUser, reqParams, localRendering) {
  try {
    if (handlePublicRequest(loggedUser, reqParams, localRendering)) return true;
  } catch (e) {
    console.error('user api error', e, e.stack);
    return localRendering({ error: e });
  }
  return handleAuthRequest(loggedUser, reqParams, localRendering);
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('api.user.controller', reqParams);
  reqParams = reqParams || {};

  function localRendering(r) {
    if (r) delete r.pwd;
    if (!r || r.error)
      console.log(
        'api.user.' + (reqParams._action || 'controller') + ' ERROR:',
        (r || {}).error || r
      );
    response.renderJSON(
      reqParams.callback ? snip.renderJsCallback(reqParams.callback, r) : r
    );
  }

  var loggedUser = request.checkLogin(/*response*/);
  handleRequest(
    loggedUser,
    request.method.toLowerCase() === 'post' ? request.body : reqParams,
    localRendering
  );
};

// tests: run the following line(s) in the javascript console of a openwhyd page:
// $.get("http://localhost:8080/api/user?callback=alert");
// $.getJSON("http://localhost:8080/api/user?callback=?", function(a){console.log(a);});
