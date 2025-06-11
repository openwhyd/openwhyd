/**
 * module that emails only admins
 * @author adrienjoly, whyd
 **/

const emailSender = require('./emailMailerSend.js');
const fakeEmailSender = require('./emailFake.js');

//console.log("EMAIL ADMINS ONLY");

exports.email = function (
  emailAddr,
  subject,
  textContent,
  htmlContent,
  userName,
  callback,
) {
  const isAdmin =
    emailAddr.indexOf(process.env.WHYD_ADMIN_EMAIL.split('@')[0]) > -1;

  console.log('email address is admin? ', isAdmin);

  const emailImpl = (isAdmin ? emailSender : fakeEmailSender)['email'];

  return emailImpl(
    emailAddr,
    subject,
    textContent,
    htmlContent,
    userName,
    callback,
  );
};
// when config.emailModule is set, this method will be overidden (see at bottom)
