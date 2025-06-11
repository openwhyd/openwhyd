// test email model

const notifModel = require('../../templates/notif.js');
const emailModel = require('../../models/email.js');

function sendEmails(user, template, cb) {
  //var fbCookie = request.getFacebookCookie();
  //if (!fbCookie || !fbCookie.uid)
  //	emailModel.notif(user.id, template.subject, template.bodyText, fbCookie.access_token);
  //else
  emailModel.email(
    user.email,
    '[TEXT] ' + template.subject,
    template.bodyText,
    null,
    user.name,
    function (resText) {
      emailModel.email(
        user.email,
        '[HTML] ' + template.subject,
        null,
        template.bodyHtml,
        user.name,
        function (resHtml) {
          cb({
            to: user.email,
            subject: template.subject,
            textResult: resText,
            htmlResult: resHtml,
            bodyText: template.bodyText,
            bodyHtml: template.bodyHtml,
          });
        },
      );
    },
  );
}

exports.sendTestEmail = async function (user) {
  const email = notifModel.generateRegWelcome(user);
  // const email = await new Promise((resolve) =>
  //   notifModel.generateRegWelcomeAsync(
  //     user,
  //     { name: 'inviteSender', id: '7' },
  //     resolve,
  //   ),
  // );
  return await new Promise((resolve) => sendEmails(user, email, resolve));
};

exports.controller = async function (request, reqParams, response) {
  console.log('test email notif');

  const user = await request.checkLogin(response);
  if (!user) return;

  const res = await exports.sendTestEmail(user);
  response.legacyRender(res);
};
