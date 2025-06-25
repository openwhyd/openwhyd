// test email model

const notifModel = require('../../templates/notif.js');
const emailModel = require('../../models/email.js');

async function sendEmails(user, template) {
  const resText = await new Promise((resolve) =>
    emailModel.email(
      user.email,
      template.subject + ' - TEXT version',
      template.bodyText,
      null,
      user.name,
      resolve,
    ),
  );
  const resHtml = await new Promise((resolve) =>
    emailModel.email(
      user.email,
      template.subject + ' - HTML version',
      null,
      template.bodyHtml,
      user.name,
      resolve,
    ),
  );
  return {
    to: user.email,
    subject: template.subject,
    textResult: resText,
    htmlResult: resHtml,
    bodyText: template.bodyText,
    bodyHtml: template.bodyHtml,
  };
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
  return await sendEmails(user, email);
};

exports.controller = async function (request, reqParams, response) {
  console.log('test email notif');

  const user = await request.checkLogin(response);
  if (!user) return;

  const res = await exports.sendTestEmail(user);
  response.legacyRender(res);
};
