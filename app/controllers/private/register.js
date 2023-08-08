/**
 * register controller (derived from facebookLogin)
 * register new users coming from the /invite form
 * @author adrienjoly, whyd
 */

var userModel = require('../../models/user.js');
var followModel = require('../../models/follow.js');
var emailModel = require('../../models/email.js'); // for validation
var notifModel = require('../../models/notif.js');
var inviteController = require('../invite.js');
var userApi = require('../../controllers/api/user.js');
var htmlRedirect = require('../../templates/logging.js').htmlRedirect;
var genuine = require('../../genuine.js');
const argon2 = require('argon2');
const notifEmails = require('../../models/notifEmails.js');
const mongodb = require('../../models/mongodb.js');

const ENFORCE_GENUINE_SIGNUP = true; // may require x-real-ip header from the nginx proxy
const { genuineSignupSecret } = process.appParams;
var onboardingUrl = '/';
var checkInvites = false;

function follow(user, userToFollow, ctx) {
  followModel.add(
    {
      uId: user.id,
      uNm: user.name,
      tId: userToFollow.id,
      tNm: userToFollow.name,
      ctx: ctx,
    },
    function () {
      console.log('auto follow: ', user.name, userToFollow.name);
    },
  );
}

function renderError(request, getParams, response, errorMsg) {
  var json = { error: errorMsg };
  response[getParams.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
    json,
  );
}

/**
 * called when user submits the form from register.html
 */
exports.registerInvitedUser = function (request, user, response) {
  request.logToConsole(
    'register.registerInvitedUser',
    user
      ? {
          inviteCode: user.inviteCode,
          email: user.email,
          name: user.name,
          fbUid: user.fbUid,
          fbTok: user.fbTok,
          iBy: user.iBy,
          iPo: user.iPo,
          iRf: user.iRf,
          iPg: user.iPg,
          sTk: user.sTk || '', // signup token (genuine client check)
          ajax: user.ajax,
          fbRequest: user.fbRequest,
        }
      : null,
  );

  user = user || {};

  var error = !user.ajax ? inviteController.renderRegisterPage : renderError;

  if (ENFORCE_GENUINE_SIGNUP) {
    if (!user.sTk || typeof user.sTk !== 'string')
      return error(request, user, response, 'Invalid sTk');
    const genuineToken = genuine.checkSignupToken(
      genuineSignupSecret,
      user.sTk || '',
      request,
    );
    if (!genuineToken)
      return error(request, user, response, 'Non genuine signup request');
  }

  if (!user.name)
    return error(request, user, response, 'Please enter your name');

  if (!user.password)
    return error(request, user, response, 'Please enter a password');

  if (!user.email)
    return error(request, user, response, 'Please enter your email');

  if (checkInvites && !user.inviteCode)
    return error(request, user, response, 'Invalid invite code');

  user.email = emailModel.normalize(user.email);

  if (!emailModel.validate(user.email))
    return error(request, user, response, 'This email address is invalid');

  if (user.name == 'Your Name' || user.name.trim() == '')
    return error(request, user, response, "Don't you have a name, dude ?");

  if (user.fbId && isNaN('' + user.fbId))
    return error(request, user, response, 'Invalid Facebook id');

  if (user.password == 'password')
    return error(
      request,
      user,
      response,
      'You have to set your password first',
    );
  else if (user.password.length < 4 || user.password.length > 32)
    return error(
      request,
      user,
      response,
      'Your password must be between 4 and 32 characters',
    );
  //else if (!pwdRegex.test(user.password))
  //	return error(request, user, response, "Your password contains invalid characters");

  function registerUser() {
    userModel.fetchByEmail(user.email, function (item) {
      if (item)
        return error(
          request,
          user,
          response,
          'This email address is already registered on whyd',
        );

      var dbUser = {
        name: user.name,
        email: user.email,
        pwd: userModel.md5(user.password),
        arPwd: argon2.hash(user.password).toString('hex'),
        img: '/images/blank_user.gif', //"http://www.gravatar.com/avatar/" + userModel.md5(user.email)
      };

      if (user.iBy) dbUser.iBy = user.iBy; // invited by (user id)
      if (user.iPo) dbUser.iPo = user.iPo; // invited on post (id)
      if (user.iRf) dbUser.iRf = user.iRf; // referer of invite page (for analytics)
      if (user.iPg) dbUser.iPg = user.iPg; // invite page (e.g. user profile)
      if (user.fbRequest) dbUser.fbR = user.fbRequest; // fb invite request id
      if (user.fbUid) {
        dbUser.fbId = user.fbUid; // fb user id
        dbUser.img = '//graph.facebook.com/v2.3/' + user.fbUid + '/picture';
      }
      if (user.fbTok) {
        dbUser.fbTok = user.fbTok;
      }

      userModel.save(dbUser, afterSave);
    });
  }

  function afterSave(storedUser) {
    if (!storedUser)
      return error(
        request,
        user,
        response,
        'Oops, your registration failed... Please try again!',
      );

    if (user.fbRequest) userModel.removeInviteByFbRequestIds(user.fbRequest);
    else userModel.removeInvite(user.inviteCode);

    function loginAndRedirectTo(url) {
      request.session.whydUid = storedUser.id || storedUser._id; // CREATING SESSION
      if (user.ajax) {
        var json = { redirect: url, uId: '' + storedUser._id };
        const renderJSON = () => {
          response[user.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
            json,
          );
        };
        if (user.includeUser) {
          userApi.fetchUserData(storedUser, function (user) {
            json.user = user;
            renderJSON(json);
          });
        } else renderJSON(json);
      } else response.renderHTML(htmlRedirect(url));

      console.log('sending welcome email', storedUser.email, storedUser.iBy);
      const inviteSender = storedUser.iBy
        ? mongodb.getUserFromId(storedUser.iBy)
        : null;
      notifEmails.sendRegWelcomeAsync(storedUser, inviteSender);
    }

    // connect users
    if (user.iBy) {
      const inviteSender = {
        id: user.iBy,
        name: request.getUserNameFromId(user.iBy),
      };
      follow(storedUser, inviteSender, 'invite');
      follow(inviteSender, storedUser, 'invite');
      notifModel.inviteAccepted(user.iBy, storedUser);
    }

    loginAndRedirectTo(onboardingUrl || '/');
  }

  if (user.iBy || checkInvites)
    inviteController.checkInviteCode(request, user, response, function () {
      registerUser();
    });
  else registerUser();
};

exports.controller = function (request, getParams, response) {
  request.logToConsole('register.controller', request.method);
  if (request.method.toLowerCase() === 'post')
    // sent by (new) register form
    exports.registerInvitedUser(request, request.body, response);
  else inviteController.renderRegisterPage(request, getParams, response);
};
