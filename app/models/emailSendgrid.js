/**
 * Sendgrid email implementation (used by email.js generic wrapper)
 * to send emails through Sendgrid API.
 **/

var https = require('https');
var snip = require('./../snip.js');
var querystring = require('querystring');

if (process.env['SENDGRID_API_KEY'] === undefined)
  throw new Error(`missing env var: SENDGRID_API_KEY`);

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

exports.email = function (
  emailAddr,
  subject,
  textContent,
  htmlContent,
  userName,
  callback,
) {
  console.log('[EMAIL] about to send:', snip.formatEmail(emailAddr), subject);

  if (!emailAddr)
    return callback && callback({ error: 'no email address was provided' });

  if (process.env['SENDGRID_API_FROM_EMAIL'] === undefined)
    throw new Error(`missing env var: SENDGRID_API_FROM_EMAIL`);
  if (process.env['SENDGRID_API_FROM_NAME'] === undefined)
    throw new Error(`missing env var: SENDGRID_API_FROM_NAME`);

  // Set up message
  var content = {
    from: process.env.SENDGRID_API_FROM_EMAIL, // e.g. "no-reply@whyd.org",
    fromname: process.env.SENDGRID_API_FROM_NAME, // e.g. "whyd",
    to: emailAddr,
    subject: subject,
    text: textContent,
  };

  if (userName) content.toname = userName;
  if (htmlContent) content.html = htmlContent;

  content = querystring.stringify(content);

  // Initiate REST request
  var request = https
    .request(
      {
        method: 'POST',
        host: 'sendgrid.com',
        port: 443,
        path: '/api/mail.send.json',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-length': content.length,
        },
      },
      function (response) {
        var data = '';
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.on('end', function () {
          console.log('[EMAIL] response:', data);
          if (callback) callback(data);
        });
      },
    )
    .on('error', function (err) {
      console.log('[EMAIL] send error:', err);
      console.error('[EMAIL] send error:', err);
      if (callback) callback({ error: err });
    });

  // Send request
  request.write(content);
  request.end();
};
