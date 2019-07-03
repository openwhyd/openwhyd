/**
 * thanks controller
 * called by landing page when visitor submits an email address, for requesting an invite
 * @author adrienjoly, whyd
 */

var config = require('../../models/config.js');
var user = require('../../models/user.js');
var email = require('../../models/email.js');

exports.controller = function(request, reqParams, response) {
  request.logToConsole('thanks.controller', reqParams);

  if (!reqParams || !reqParams.mail)
    return response.render(
      'You must provide a valid email address.' +
        "<script>window.location.href='/';</script>",
      null,
      { 'content-type': 'text/html' }
    );

  user.fetchByEmail(reqParams.mail, function(u) {
    if (u)
      response.render(
        "You've already registered, please log in using the link below:" +
          "<script>window.location.href='" +
          config.urlPrefix +
          '/login?email=' +
          reqParams.mail +
          "';</script>"
      );
    else {
      user.fetchInviteByEmail(reqParams.mail, function(u) {
        if (u)
          response.render(
            'Please follow the link of the invite email we sent you' +
              "<script>window.location.href='" +
              config.urlPrefix +
              '/invite/' +
              u._id +
              "';</script>"
          );
        else {
          user.fetchEmail(reqParams.mail, function(err, email) {
            console.log(reqParams.mail, err, email);
            if (!email) {
              user.storeEmail(reqParams.mail);

              email.email(
                reqParams.mail,
                'whyd registration',
                'Thank you for your interest in whyd!\n\n' +
                  'We will let you know when we launch the service.\n\n' +
                  'Greetings from the Openwhyd team! :-) \n' +
                  process.appParams.urlPrefix
              );

              response.render('Thank you! Invite your friends to join!');
            } else response.render("Don't forget to check your spam folder!");
          });
        }
      });
    }
  });

  //response.sendFile(this._publicDir + '/landingDone.html');
};
