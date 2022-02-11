/**
 * register controller (derived from facebookLogin)
 * register new users coming from the /invite form
 * @author adrienjoly, whyd
 */

var userModel = require('../../models/user.js');
var userApi = require('../../controllers/api/user.js');
var htmlRedirect = require('../../templates/logging.js').htmlRedirect;
const argon2 = require('argon2');

var onboardingUrl = '/';

function renderError(request, getParams, response, errorMsg) {
  var json = { error: errorMsg };
  response[getParams.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
    json
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
          ajax: user.ajax,
          fbRequest: user.fbRequest,
        }
      : null
  );

  user = user || {};

  var error = renderError;

  if (!user.name)
    return error(request, user, response, 'Please enter your name');

  if (!user.password)
    return error(request, user, response, 'Please enter a password');

  if (!user.email)
    return error(request, user, response, 'Please enter your email');

  if (user.name == 'Your Name' || user.name.trim() == '')
    return error(request, user, response, "Don't you have a name, dude ?");

  if (user.password == 'password')
    return error(
      request,
      user,
      response,
      'You have to set your password first'
    );
  else if (user.password.length < 4 || user.password.length > 32)
    return error(
      request,
      user,
      response,
      'Your password must be between 4 and 32 characters'
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
          'This email address is already registered on whyd'
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

      userModel.save(dbUser, afterSave);
    });
  }

  function afterSave(storedUser) {
    if (!storedUser)
      return error(
        request,
        user,
        response,
        'Oops, your registration failed... Please try again!'
      );

    function loginAndRedirectTo(url) {
      request.session.whydUid = storedUser.id || storedUser._id; // CREATING SESSION
      if (user.ajax) {
        var json = { redirect: url, uId: '' + storedUser._id };
        const renderJSON = () => {
          response[user.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
            json
          );
        };
        if (user.includeUser) {
          userApi.fetchUserData(storedUser, function (user) {
            json.user = user;
            renderJSON(json);
          });
        } else renderJSON(json);
      } else response.renderHTML(htmlRedirect(url));
    }

    loginAndRedirectTo(onboardingUrl || '/');
  }

  registerUser();
};

exports.controller = function (request, getParams, response) {
  request.logToConsole('register.controller', request.method);
  // sent by (new) register form
  exports.registerInvitedUser(request, request.body, response);
};
