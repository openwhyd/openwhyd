/**
 * password controller
 * helps user to reset his password
 * @author adrienjoly, whyd
 */

var config = require('../../models/config.js');
var users = require('../../models/user.js');
var md5 = users.md5;
var templateLoader = require('../../templates/templateLoader.js');

exports.checkResetCode = function (request, reqParams, response, okCallback) {
  if (!reqParams.resetCode || !reqParams.uid) {
    console.log('resetCode and uid parameters are required');
    response.legacyRender(
      'Your password reset request is invalid. Please try to login on ' +
        process.appParams.urlPrefix
    );
    return false;
  }

  users.fetchByUid(reqParams.uid, function (user) {
    if (user && user.pwd == reqParams.resetCode) {
      if (okCallback) okCallback(user);
    } else {
      console.log('invalid password reset request');
      response.legacyRender(
        'Your password reset request is invalid or expired. Please try to login on ' +
          process.appParams.urlPrefix
      );
    }
  });
};

/**
 * called when a user wants to reset his password
 */
exports.renderForgotPage = function (request, reqParams, response, error) {
  reqParams = reqParams || {};

  request.logToConsole('password.renderForgotPage', {
    email: reqParams.email,
    error: reqParams.error,
    redirect: reqParams.redirect,
  });

  var vars = {
    email: reqParams.email,
    error: error || reqParams.error || '',
    redirect: reqParams.redirect || '',
  };

  templateLoader.loadTemplate(
    'app/templates/passwordForgot.html',
    function (template) {
      response.legacyRender(template.render(vars), null, {
        'content-type': 'text/html',
      });
    }
  );
};

/**
 * called when user follows the password reset URL (/password?uid=xxx&resetCode=yyy), e.g. provided in an email
 */
exports.renderPasswordPage = function (request, reqParams, response, error) {
  reqParams = reqParams || {};

  request.logToConsole('password.renderPasswordPage', {
    uid: reqParams.uid,
    resetCode: reqParams.resetCode,
    email: reqParams.email,
    error: reqParams.error,
    redirect: reqParams.redirect,
  });

  exports.checkResetCode(request, reqParams, response, function (user) {
    var vars = {
      resetCode: reqParams.resetCode,
      uid: user.id,
      email: user.email,
      password: reqParams.password || '',
      password2: reqParams.password2 || '',
      error: error || reqParams.error || '',
      redirect: reqParams.redirect || '',
    };

    //var html = Mustache.to_html(htmlTemplate, vars);
    //response.legacyRender(html, null, {'content-type': 'text/html'});
    templateLoader.loadTemplate(
      'app/templates/passwordSet.html',
      function (template) {
        response.legacyRender(template.render(vars), null, {
          'content-type': 'text/html',
        });
      }
    );
  });
};

/**
 * called when user submits the form from password.html
 */
exports.resetPassword = function (request, reqParams, response) {
  request.logToConsole(
    'register.resetPassword',
    reqParams
      ? {
          resetCode: reqParams.resetCode,
          uid: reqParams.uid,
          email: reqParams.email,
          redirect: reqParams.redirect,
        }
      : null
  );

  reqParams = reqParams || {};

  if (!reqParams.resetCode || !reqParams.uid || !reqParams.password)
    return exports.renderPasswordPage(
      request,
      reqParams,
      response,
      'missing required parameters'
    );

  if (reqParams.password == 'password' || reqParams.password.trim() == '')
    return exports.renderPasswordPage(
      request,
      reqParams,
      response,
      'Please enter your new password twice'
    );
  else if (reqParams.password.length < 4 || reqParams.password.length > 32)
    return exports.renderPasswordPage(
      request,
      reqParams,
      response,
      'Your password must be between 4 and 32 characters'
    );
  //else if (!pwdRegex.test(reqParams.password))
  //	return exports.renderPasswordPage(request, reqParams, response, "Your password contains invalid characters");

  exports.checkResetCode(request, reqParams, response, function (user) {
    users.save(
      { _id: user._id, pwd: md5(reqParams.password) },
      function (storedUser) {
        if (!storedUser)
          return exports.renderPasswordPage(
            request,
            reqParams,
            response,
            'Oops, your request failed... Please try again!'
          );

        console.log('password reset ok');

        if (reqParams.redirect) return response.redirect(reqParams.redirect);
        else
          return response.legacyRender(
            'Your password was successfully updated! You can now login there: ' +
              config.urlPrefix
          );
        //, null, {'content-type': 'text/html'});
      }
    );
  });
};

exports.controller = function (request, getParams, response) {
  request.logToConsole('password.controller', request.method);

  if (request.method.toLowerCase() === 'post')
    exports.resetPassword(request, request.body /*postParams*/, response);
  else
    exports[
      getParams && getParams.uid ? 'renderPasswordPage' : 'renderForgotPage'
    ](request, getParams, response);
};
