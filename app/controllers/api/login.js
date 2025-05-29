/**
 * login controller, to authenticate users
 */
const snip = require('../../snip.js');
const config = require('../../models/config.js');
const emailModel = require('../../models/email.js');
const userModel = require('../../models/user.js');
const notifEmails = require('../../models/notifEmails.js');
const userApi = require('../../controllers/api/user.js');

const md5 = userModel.md5;
const loggingTemplate = require('../../templates/logging.js');

exports.handleRequest = function (request, form, response, ignorePassword) {
  form = form || {};
  if (form.password && !form.md5) form.md5 = md5(form.password);

  request.logToConsole('login.handleRequest', {
    action: form.action,
    email: form.email,
    md5: form.md5,
  });

  function renderJSON(json) {
    response[form.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](json);
  }

  // in case of successful login
  function renderRedirect(url, user) {
    // useful for legacy auth/session only
    request.session = request.session || {};
    request.session.whydUid = (user || {}).id;
    if (!form.ajax) response.renderHTML(loggingTemplate.htmlRedirect(url));
    else {
      const json = { redirect: url };
      if (form.includeUser) {
        userApi.fetchUserData(user, function (user) {
          json.user = user;
          renderJSON(json);
        });
      } else renderJSON(json);
    }
  }

  function renderForm(form) {
    delete request.session; // legacy auth/session
    if (form.ajax) renderJSON(form);
    else response.renderHTML(loggingTemplate.renderLoginPage(form));
  }

  if (form.action === 'logout') {
    // useful for legacy auth/session only
    request.session.destroy(function (err) {
      if (err) {
        console.error('error from request.session.destroy()', err);
        form.error = err;
      }
      console.log('logout result', form.error);
      renderForm(form);
    });
    return;
  } else if (form.email) {
    form.email = emailModel.normalize(form.email);

    userModel[form.email.indexOf('@') > -1 ? 'fetchByEmail' : 'fetchByHandle'](
      form.email,
      function (dbUser) {
        if (
          form.redirect &&
          snip.getSafeOpenwhydURL(form.redirect, config.urlPrefix) === false
        ) {
          form.error = 'Unsafe redirect target';
        } else if (!dbUser) {
          form.error = "Are you sure? We don't recognize your email address!";
        } else if (form.action == 'forgot') {
          notifEmails.sendPasswordReset(dbUser._id, dbUser.pwd, form.redirect);
          /*form.error*/ form.ok =
            'We just sent you an email to reset your password, wait for it!';
        } else if (
          !ignorePassword &&
          !form.md5 /*(!form.password || form.password == "password")*/
        ) {
          form.error = 'Please enter your password below:';
        } else if (
          form.action == 'login' &&
          (ignorePassword || dbUser.pwd == form.md5)
        ) {
          // console.log('ok, user logged in as: ' + dbUser.name);
          renderRedirect(form.redirect || '/', dbUser);
          return; // prevent default response (renderForm)
        } else if (form.action != 'logout') {
          form.wrongPassword = 1;
          form.error = 'Your password seems wrong... Try again!';
        }

        console.log('login result', form.error);
        renderForm(form);
      },
    );
  } else renderForm(form);
};

exports.controller = function (request, getParams, response) {
  if (request.method.toLowerCase() === 'post')
    exports.handleRequest(request, request.body, response);
  else exports.handleRequest(request, getParams, response);
};
