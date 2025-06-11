/**
 * generic email wrapper
 * send emails through a specified provider
 * @author adrienjoly, whyd
 **/

//var https = require('https');
const config = require('./config');
const users = require('./user');

const emailModule = config.emailModule || 'emailFake.js';
console.log('loading EMAIL module: ' + emailModule + '...');
const emailImpl = require('./' + emailModule);

exports.validate = require('./email-validation.js').validate;

exports.normalize = function (email) {
  if (!email) return email;
  if (typeof email != 'string') {
    console.error('(malicious?) non-string email:', email, new Error().stack);
    return '';
  }
  return email.trim().toLowerCase();
};

exports.email = function (
  emailAddr,
  subject,
  textContent,
  htmlContent,
  userName,
  callback,
) {
  return emailImpl.email(
    emailAddr,
    subject,
    textContent,
    htmlContent,
    userName,
    callback,
  );
};

exports.notif = function (toUid, subject, text /*, fbAccessToken*/) {
  if (!toUid) {
    console.trace('ERROR: unable to send email to user ' + toUid);
    return;
  }

  users.fetchByUid(toUid, function (user) {
    if (!user || !user.email) {
      console.log(
        'ERROR: found no email address for user ' + toUid + ' : ',
        user,
      );
      return;
    } else {
      /*
		if (!user.email || user.email.endsWith("proxymail.facebook.com")) {
			var params = [
				"recipients=" + toUid,
				"subject=" + encodeURIComponent(subject),
				"text=" + encodeURIComponent(text),
				"access_token=" + fbAccessToken
			];
			console.log ("email.notif through facebook:", params);
			var host = "api.facebook.com"; // https
			var path = "/method/notifications.sendEmail?" + params.join("&");
			//console.log("requesting: "+host+path+"...");
			https.get({ host: host, path: path }, logResponse);
		} */
      const to = user.email;
      //var to = user.name + " <" + user.email + ">";
      //console.log("sending email to " + to);
      exports.email(to, subject, text, null, user.name);
    }
  });
};
