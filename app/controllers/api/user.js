// @ts-check

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

const snip = require('../../snip.js');
const mongodb = require('../../models/mongodb.js');
const postModel = require('../../models/post.js');
const userModel = require('../../models/user.js');
const emailModel = require('../../models/email.js');
const followModel = require('../../models/follow.js');
const notifEmails = require('../../models/notifEmails.js');
const uploadCtr = require('../uploadedFile.js');

// for when called through subdir controller
const SEQUENCED_PARAMETERS = { _1: 'id', _2: 'action' }; //[null, "id", "action"];

function addUserInfo(userSub, mySub) {
  const mySubIdSet = {};
  if (mySub) for (const i in mySub) mySubIdSet[mySub[i].id] = true;
  for (const i in userSub) {
    const user = userSub[i];
    user.subscribed = mySubIdSet[user.id];
  }
  return userSub;
}

/** @typedef {{auth?: import('../../lib/my-http-wrapper/http/AuthFeatures.js').AuthFeatures}} Features */

/** @type {Record<string, (params: any, cb: (any) => void, features: Features) => void>} */
const publicActions = {
  subscriptions: function (p, cb) {
    if (!p || !p.id) cb({ error: 'user not found' });
    else
      followModel.fetchUserSubscriptions(p.id, function (sub) {
        userModel.fetchUserBios(sub.subscriptions, function () {
          if (p.loggedUser && p.loggedUser.id != p.id)
            followModel.fetchUserSubscriptions(
              p.loggedUser.id,
              function (mySub) {
                cb(
                  sub
                    ? addUserInfo(
                        sub.subscriptions,
                        mySub ? mySub.subscriptions : [],
                      )
                    : null,
                );
              },
            );
          else
            cb(
              sub
                ? addUserInfo(
                    sub.subscriptions,
                    p.loggedUser ? sub.subscriptions : [],
                  )
                : null,
            );
        });
      });
  },
  subscribers: function (p, cb) {
    if (!p || !p.id) cb({ error: 'user not found' });
    else
      followModel.fetchUserSubscriptions(p.id, function (sub) {
        userModel.fetchUserBios(sub.subscribers, function () {
          if (p.loggedUser && p.loggedUser.id != p.id)
            followModel.fetchUserSubscriptions(
              p.loggedUser.id,
              function (mySub) {
                cb(
                  sub
                    ? addUserInfo(
                        sub.subscribers,
                        mySub ? mySub.subscriptions : [],
                      )
                    : null,
                );
              },
            );
          else
            cb(
              sub
                ? addUserInfo(
                    sub.subscribers,
                    p.loggedUser ? sub.subscriptions : [],
                  )
                : null,
            );
        });
      });
  },
  delete: function (p, cb, features) {
    if (!p || !p.loggedUser || !p.loggedUser.id)
      cb({ error: 'Please log in first' });
    else {
      console.log(
        `deleting user id: ${p.loggedUser.id}, handle: ${p.loggedUser.handle}`,
      );
      userModel.delete(features, { _id: p.loggedUser.id }, function (r) {
        console.log('deleted user', p.loggedUser.id, r);
      });
      notifEmails.sendUserDeleted(p.loggedUser.id, p.loggedUser.name);
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
      notifEmails.askAccountDeletion(p.loggedUser.id, p.loggedUser.name);
      cb({ ok: 1, message: 'Thank you, we will get back to you shortly.' });
    }
  },
};

function defaultSetter(fieldName) {
  return function (p, cb) {
    const u = { _id: p._id };
    u[fieldName.replace('_', '.')] = p[fieldName];
    userModel.save(u, cb);
  };
}

/** @type {Record<string, (params: any, cb: (any) => void, features: Features) => void>} */
const fieldSetters = {
  name: function (p, cb, features) {
    userModel.renameUser(features, p._id, p.name, cb);
  },
  img: function (p, cb) {
    userModel.fetchByUid(p._id, async function (user) {
      if (hasProfileImage(user)) {
        console.log('deleting previous profile pic: ' + user.img);
        await uploadCtr
          .deleteFile(user.img)
          .catch(() =>
            console.log(
              'failed to delete existing profile image in fieldSetters.img',
            ),
          );
      }
      const newFilename = hasProfileImage(p)
        ? await new Promise((resolve) =>
            uploadCtr.moveTo(p.img, uploadCtr.config.uAvatarImgDir, resolve),
          )
        : p.img;
      defaultSetter('img')({ _id: p._id, img: newFilename || p.img }, cb);
      // TODO: inform Auth0, if applicable
    });
  },
  cvrImg: function (p, cb) {
    userModel.fetchByUid(p._id, function (user) {
      if (user.cvrImg && user.cvrImg.indexOf('blank') == -1) {
        console.log('deleting previous cover image: ' + user.cvrImg);
        uploadCtr
          .deleteFile(user.cvrImg)
          .catch((err) => console.log(err, err.stack));
      }
      function actualUpdate(newFilename) {
        defaultSetter('cvrImg')(
          { _id: p._id, cvrImg: newFilename || p.cvrImg },
          cb,
        );
      }
      if (p.cvrImg.indexOf('blank') == -1)
        uploadCtr.moveTo(p.cvrImg, uploadCtr.config.uCoverImgDir, actualUpdate);
      else userModel.update(p._id, { $unset: { cvrImg: 1 } }, cb); // remove cvrImg attribute
    });
  },
  pwd: function (p, cb, features) {
    userModel.fetchByUid(p._id, function (item) {
      if (features.auth?.sendPasswordChangeRequest) {
        features.auth
          .sendPasswordChangeRequest(item.email)
          .then(() =>
            cb({ error: 'We sent you an email to change your password.' }),
          );
      } else if (item && item.pwd == userModel.md5(p.oldPwd || '')) {
        defaultSetter('pwd')({ _id: p._id, pwd: userModel.md5(p.pwd) }, cb);
        notifEmails.sendPasswordUpdated(p._id, item.email);
      } else cb({ error: 'Your current password is incorrect' });
    });
  },
  handle: function (p, cb, features) {
    userModel.setHandle(features, p._id, p.handle, cb);
  },
  email: function (p, cb, features) {
    p.email = emailModel.normalize(p.email);
    if (!emailModel.validate(p.email))
      cb({ error: 'This email address is invalid' });
    else
      userModel.fetchByEmail(p.email, async function (existingUser) {
        if (!existingUser) {
          notifEmails.sendEmailUpdated(p._id, p.email);
          const savedUser = await new Promise((resolve) =>
            defaultSetter('email')(p, resolve),
          );
          if (savedUser) features.auth?.setUserEmail(p._id, p.email);
          cb(savedUser);
        } else if ('' + existingUser._id == p._id)
          // no change
          cb({ email: p.email });
        else cb({ error: 'This email already belongs to another user' });
      });
  },
  pref: function (p, cb) {
    // type each provided pref value accordingly to defaults. "true" boolean was translated to "1"
    for (const i in p.pref)
      p.pref[i] =
        typeof userModel.DEFAULT_PREF[i] == 'boolean'
          ? p.pref[i] == 1
          : p.pref[i];
    userModel.setPref(p._id, p.pref, cb);
  },
  fbId: function (p, cb) {
    userModel.setFbId(p._id, p.fbId, cb, p.fbTok);
  },
  twId: function (p, cb) {
    userModel.setTwitterId(p._id, p.twId, p.twTok, p.twSec, cb);
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

function hasProfileImage(user) {
  return user.img?.indexOf('blank_user.gif') == -1;
}

function hasSubscribed(loggedUser, user, cb) {
  user = user || {};
  const uId = user.id || user._id;
  if (uId && loggedUser)
    followModel.get({ uId: loggedUser.id, tId: uId }, function (err, res) {
      user.isSubscribing = !!res;
      cb(user);
    });
  else cb(user);
}

function countUserSubscr(user, cb) {
  const uId = '' + user._id;
  followModel.countSubscriptions(uId, function (res) {
    user.nbSubscriptions = res;
    followModel.countSubscribers(uId, function (res) {
      user.nbSubscribers = res;
      cb(user);
    });
  });
}

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
  const ops = [countUserSubscr, countUserPosts, countUserLikes];
  (function next() {
    if (!ops.length) cb(user);
    else ops.pop().apply(null, [user, next]);
  })();
};

function fetchUserById(uId, options, cb) {
  options = options || {};
  userModel.fetchByUid(uId, function (user) {
    if (!user) return cb();
    userModel.fetchPlaylists(user, {}, async function (playlists) {
      user.pl = playlists || user.pl;
      if (options.excludePrivateFields) {
        delete user.pwd;
        delete user.email;
        delete user.lastFm;
        delete user.pref;
        delete user.fbTok;
        delete user.twTok;
        delete user.twSec;
      }
      if (options.includeSubscr) {
        await new Promise((resolve) => countUserSubscr(user, resolve));
      }
      cb(user);
    });
  });
}

async function fetchUserByIdOrHandle(uidOrHandle, options, cb) {
  function returnUser(u) {
    const uId = (u || {}).id;
    if (!uId) cb({ error: 'user not found' });
    else fetchUserById(uId, options, cb);
  }
  const u = (await mongodb.getUserFromId(uidOrHandle)) || {};
  if (u.id) returnUser(u);
  else userModel.fetchByHandle(uidOrHandle, returnUser);
}

function handlePublicRequest(loggedUser, reqParams, localRendering, features) {
  // transforming sequential parameters to named parameters
  reqParams = snip.translateFields(reqParams, SEQUENCED_PARAMETERS);

  const handler = publicActions[reqParams.action];
  if (handler) {
    reqParams.loggedUser = loggedUser;
    handler(reqParams, localRendering, features);
    return true;
  } else if (reqParams.id) {
    reqParams.excludePrivateFields = true;
    fetchUserByIdOrHandle(reqParams.id, reqParams, function (u) {
      const tasks = [localRendering];
      if (reqParams.isSubscr)
        tasks.push(function (u, next) {
          hasSubscribed(loggedUser, u, next);
        });
      if (reqParams.countPosts) tasks.push(countUserPosts);
      if (reqParams.countLikes) tasks.push(countUserLikes);
      (function next() {
        const fct = tasks.pop();
        fct && fct(u, next);
      })();
    });
    return true;
  }
}

function handleAuthRequest(loggedUser, reqParams, localRendering, features) {
  // make sure a registered user is logged, or return an error page
  if (false == loggedUser)
    return localRendering({ error: 'user not logged in' });

  reqParams._id = loggedUser._id;

  const toUpdate = [];
  for (const i in fieldSetters)
    if (reqParams[i] !== undefined) toUpdate.push(i);

  if (toUpdate.length) {
    const result = {};
    (function setNextField(prevResult) {
      if (prevResult)
        for (const i in prevResult) result[i] = prevResult[i] || result[i];
      if (!toUpdate.length) localRendering(result);
      else {
        const fieldName = toUpdate.pop();
        console.log('calling field setter: ', fieldName);
        reqParams._id = loggedUser._id; // force the logged user id
        fieldSetters[fieldName](reqParams, setNextField, features);
      }
    })();
  } else {
    fetchUserById(loggedUser._id, reqParams, localRendering);
  }
}

// old name: setUserFields()
function handleRequest(loggedUser, reqParams, localRendering, features) {
  try {
    if (handlePublicRequest(loggedUser, reqParams, localRendering, features))
      return true;
  } catch (e) {
    console.error('user api error', e, e.stack);
    return localRendering({ error: e });
  }
  return handleAuthRequest(loggedUser, reqParams, localRendering, features);
}

// these error messages are displayed to the user, we don't need to log them
const USER_ERRORS = [
  'Special characters are not allowed',
  'This username is taken by another user',
];

function localRendering(reqParams, r) {
  if (r) delete r.pwd;
  if (!r || r.error) {
    const errMessage = (r || {}).error || r;
    const isUserError =
      typeof errMessage === 'string' &&
      USER_ERRORS.some((userError) => errMessage.includes(userError));
    if (!isUserError)
      console.log(
        'api.user.' + (reqParams._action || 'controller') + ' ERROR:',
        errMessage,
      );
  }

  return reqParams.callback ? snip.renderJsCallback(reqParams.callback, r) : r;
}

/** @param {Features} features */
exports.controller = function (request, reqParams, response, features) {
  request.logToConsole('api.user.controller', reqParams);
  reqParams = reqParams || {};

  const loggedUser = request.checkLogin(/*response*/);
  handleRequest(
    loggedUser,
    request.method.toLowerCase() === 'post' ? request.body : reqParams,
    (result) => response.renderJSON(localRendering(reqParams, result)),
    features,
  );
};

// tests: run the following line(s) in the javascript console of a openwhyd page:
// $.get("http://localhost:8080/api/user?callback=alert");
// $.getJSON("http://localhost:8080/api/user?callback=?", function(a){console.log(a);});
