/**
 * Send emails using MailerSend (used by email.js generic wrapper)
 **/

const snip = require('./../snip.js');

const MAILERSEND_API_KEY = process.env['MAILERSEND_API_KEY'];
if (MAILERSEND_API_KEY === undefined)
  throw new Error(`missing env var: MAILERSEND_API_KEY`);

/** may reject in case of wrong credentials */
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

  if (process.env['MAILERSEND_API_FROM_EMAIL'] === undefined)
    throw new Error(`missing env var: MAILERSEND_API_FROM_EMAIL`);
  if (process.env['MAILERSEND_API_FROM_NAME'] === undefined)
    throw new Error(`missing env var: MAILERSEND_API_FROM_NAME`);

  fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        email: process.env.MAILERSEND_API_FROM_EMAIL, // e.g. "no-reply@whyd.org",
        name: process.env.MAILERSEND_API_FROM_NAME, // e.g. "whyd",
      },
      to: [
        {
          email: emailAddr,
          ...(userName ? { name: userName } : {}),
        },
      ],
      subject,
      html: htmlContent,
      text: textContent,
    }),
  })
    .then((response) => {
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.error(`[EMAIL] error status: ${response.status}`);
      }
      // Only try to parse JSON for successful responses
      return response.text();
    })
    .then((text) => {
      console.log('[EMAIL] raw response:', text);
      return text ? JSON.parse(text) : {}; // Handle empty responses
    })
    .then((res) => {
      if (res.message) throw new Error(res.message);
      callback?.({ ok: true });
    })
    .catch((error) => {
      console.error('[EMAIL] send error:', error);
      callback?.({ error });
    });
};
