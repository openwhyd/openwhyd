/**
 * login controller
 * authentify users, with IE support
 * @author adrienjoly, whyd
 */
var config = require('../../models/config.js');
var emailModel = require('../../models/email.js');
var userModel = require('../../models/user.js');
var notifEmails = require('../../models/notifEmails.js');
var userApi = require('../../controllers/api/user.js');

var md5 = userModel.md5;
var loggingTemplate = require('../../templates/logging.js');

exports.handleRequest = function(request, form, response, ignorePassword) {
  form = form || {};
  if (form.password && !form.md5) form.md5 = md5(form.password);

  request.logToConsole('login.handleRequest', {
    action: form.action,
    email: form.email,
    md5: form.md5
  });

  function renderJSON(json) {
    response[form.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](json);
  }

  // in case of successful login
  function renderRedirect(url, user) {
    request.session.whydUid = (user || {}).id;
    if (!form.ajax) response.renderHTML(loggingTemplate.htmlRedirect(url));
    else {
      var json = { redirect: url };
      if (form.includeUser) {
        userApi.fetchUserData(user, function(user) {
          json.user = user;
          renderJSON(json);
        });
      } else renderJSON(json);
    }
  }

  function renderForm(form) {
    delete request.session;
    if (form.ajax) renderJSON(form);
    else response.renderHTML(loggingTemplate.renderLoginPage(form));
  }

  if (form.mail) {
    // new email given on landing page
    form.mail = emailModel.normalize(form.mail);
    if (!emailModel.validate(form.mail))
      return renderJSON({ error: 'Please enter a valid email address' });
    userModel.fetchByEmail(form.mail, function(u) {
      if (u)
        renderJSON({
          result: "You've already registered, please log in.",
          redirect: 'javascript:login();'
        });
      else {
        userModel.fetchInviteByEmail(form.mail, function(u) {
          if (u)
            renderJSON({
              result: 'Please follow the link of the invite email we sent you.',
              redirect: config.urlPrefix + '/invite/' + u._id
            });
          else {
            userModel.fetchEmail(form.mail, function(err, email) {
              if (!email) {
                userModel.storeEmail(form.mail);
                notifEmails.sendWaitingList(form.mail);
                renderJSON({
                  result:
                    "Awesome, we just sent you an email! Please check your spam folder if you don't receive it."
                }); //Thank you! Invite your friends to join!
              } else renderJSON({ result: "Don't forget to check your spam folder!" });
            });
          }
        });
      }
    });
  } else if (form.email) {
    console.log('email=', form.email);
    form.email = emailModel.normalize(form.email);

    userModel[form.email.indexOf('@') > -1 ? 'fetchByEmail' : 'fetchByHandle'](
      form.email,
      function(dbUser) {
        if (!dbUser) {
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
          console.log('ok, user logged in as: ' + dbUser.name);
          console.log('form.fbUid', form.fbUid);
          if (form.fbUid)
            userModel.update(dbUser._id, {
              $set: {
                fbId: form.fbUid,
                fbTok: form.fbTok // accesstoken provided on last facebook login
              }
            });
          renderRedirect(form.redirect || '/', dbUser);
          return; // prevent default reponse (renderForm)
        } else if (form.action != 'logout') {
          form.wrongPassword = 1;
          form.error = 'Your password seems wrong... Try again!';
        }

        console.log('login result', form.error);
        renderForm(form);
      }
    );
  } else renderForm(form);
};

exports.controller = function(request, getParams, response) {
  if (request.method.toLowerCase() === 'post')
    exports.handleRequest(request, request.body, response);
  else exports.handleRequest(request, getParams, response);
};
