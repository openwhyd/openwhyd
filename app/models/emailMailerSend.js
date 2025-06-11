/**
 * Send emails using MailerSend (used by email.js generic wrapper)
 **/

const snip = require('./../snip.js');

const MAILERSEND_API_KEY = process.env['MAILERSEND_API_KEY'];
if (MAILERSEND_API_KEY === undefined)
  throw new Error(`missing env var: MAILERSEND_API_KEY`);

/** may reject in case of wrong credentials */
exports.email = async function (
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

  const res = await fetch('https://api.mailersend.com/v1/email', {
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
    .then((response) => response.json())
    .catch((error) => {
      console.error('[EMAIL] send error:', error);
      callback?.({ error });
    });

  console.log('[EMAIL] response:', res);
  callback?.({ ok: true });
};
