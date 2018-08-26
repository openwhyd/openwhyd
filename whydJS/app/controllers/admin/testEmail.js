// test email model

var notifModel = require('../../templates/notif.js')
var emailModel = require('../../models/email.js')

function sendEmails (user, template, cb) {
  // var fbCookie = request.getFacebookCookie();
  // if (!fbCookie || !fbCookie.uid)
  //	emailModel.notif(user.id, template.subject, template.bodyText, fbCookie.access_token);
  // else
  emailModel.email(user.email, '[TEXT] ' + template.subject, template.bodyText, null, user.name, function (resText) {
    emailModel.email(user.email, '[HTML] ' + template.subject, null, template.bodyHtml, user.name, function (resHtml) {
      cb({
        to: user.email,
        subject: template.subject,
        textResult: resText,
        htmlResult: resHtml,
        bodyText: template.bodyText,
        bodyHtml: template.bodyHtml
      })
    })
  })
}

exports.controller = function (request, reqParams, response) {
  console.log('test email notif')

  var user = request.checkLogin(response)
  if (!user) return

  function send (email) {
    sendEmails(user, email, function (res) {
      response.render(res)
    })
  }

  // send(notifModel.generateRegWelcome(user));
  notifModel.generateRegWelcomeAsync(user, {name: 'inviteSender', id: '7'}, send)
}
