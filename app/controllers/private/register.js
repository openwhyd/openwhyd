// @ts-check

/**
 * register controller (derived from facebookLogin)
 * register new users coming from the /invite form
 * @author adrienjoly, whyd
 */

const userModel = require('../../models/user.js');
const followModel = require('../../models/follow.js');
const emailModel = require('../../models/email.js'); // for validation
const notifModel = require('../../models/notif.js');
const inviteController = require('../invite.js');
const userApi = require('../../controllers/api/user.js');
const htmlRedirect = require('../../templates/logging.js').htmlRedirect;
const genuine = require('../../genuine.js');
const notifEmails = require('../../models/notifEmails.js');
const mongodb = require('../../models/mongodb.js');

const ENFORCE_GENUINE_SIGNUP = true; // may require x-real-ip header from the nginx proxy
const { genuineSignupSecret } = process.appParams;
const onboardingUrl = '/';
const checkInvites = false;

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
  const json = { error: errorMsg };
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

  const error = !user.ajax ? inviteController.renderRegisterPage : renderError;

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

  if (user.fbId && isNaN(user.fbId))
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

      const dbUser = {
        name: user.name,
        email: user.email,
        pwd: userModel.md5(user.password),
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

    userModel.removeInvite(user.inviteCode);

    function loginAndRedirectTo(url) {
      // legacy auth/session
      request.session = request.session || {};
      request.session.whydUid = storedUser.id || storedUser._id; // CREATING SESSION
      if (user.ajax) {
        const json = { redirect: url, uId: '' + storedUser._id };
        const renderJSON = (jsonData) => {
          response[user.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
            jsonData,
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

/**
 * Handler of API route used for user registration / signup.
 * @param {*} request
 * @param {*} getParams
 * @param {*} response
 * @param {{ auth: import('../../lib/my-http-wrapper/http/AuthFeatures.js').AuthFeatures }} features
 */
exports.controller = async function (request, getParams, response, features) {
  request.logToConsole('register.controller', request.method);
  const newUserFromAuth0 = features.auth?.getAuthenticatedUser(request);
  if (newUserFromAuth0) {
    console.log(
      `New user from Auth0, id: ${newUserFromAuth0.id}, hamdle: ${newUserFromAuth0.name}`,
    );
    // finalize user signup from Auth0, by persisting them into our database
    const storedUser = await new Promise((resolve) =>
      userModel.save(newUserFromAuth0, resolve),
    );
    if (storedUser) {
      console.log(
        `New user from Auth0, stored with _id: ${storedUser._id}, handle: ${storedUser.handle}`,
      );
      notifEmails.sendRegWelcomeAsync(storedUser);
      response.renderHTML(htmlRedirect('/')); // in reality, this ends up redirecting to the consent request page
    } else {
      console.error(`New user from Auth0, failed to be stored in db`);
      renderError(
        request,
        storedUser,
        response,
        'Oops, your registration failed... Please reach out to contact@openwhyd.org',
      );
    }
  } else if (request.method.toLowerCase() === 'post')
    // sent by (new) register form
    exports.registerInvitedUser(request, request.body, response);
  else inviteController.renderRegisterPage(request, getParams, response);
};
