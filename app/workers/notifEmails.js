/**
 * notification email worker: digest sender
 * sends notification emails at the selected frequency of each user
 * @author adrienjoly, whyd
 **/

const config = require('../models/config.js');
const userModel = require('../models/user.js');
const emailModel = require('../models/email.js');
const digest = require('../controllers/private/digest.js');

const DIGEST_INTERVAL = parseInt(config.digestInterval) || -1;
let timer = null;

async function processUser(u) {
  let freq = 0;
  const cleanPref = {}; // daily (by default)
  for (const i in u.pref)
    if (i.indexOf('em') == 0 && u.pref[i] > 0) {
      freq = u.pref[i];
      cleanPref[i] = u.pref[i];
    }

  // generate digest
  const options = {
    until: u.pref['prevEN'],
    frequency: userModel.EM_FREQ_LABEL[freq], // e.g. "weekly"
    includeLikes: !!cleanPref['emLik'],
    includeReposts: !!cleanPref['emAdd'],
    includeSameTracks: !!cleanPref['emSam'],
    includeSubscribers: !!cleanPref['emSub'],
  };
  console.log('[notif] ' + u._id + ':', JSON.stringify(options));

  // render and send digest (if not empty)
  if (freq > 0) {
    const renderingLabel = '[notif] rendering for user ' + u._id;
    console.log(renderingLabel, '...');
    console.time(renderingLabel);
    const email = await new Promise((resolve) =>
      digest.fetchAndGenerateNotifDigest(u, options, resolve),
    ); // TODO: catch errors from fetchAndGenerateNotifDigest
    console.timeEnd(renderingLabel);
    if (email) {
      const res = await new Promise((resolve) =>
        emailModel.email(
          u.email,
          email.subject,
          email.bodyText,
          email.bodyHtml,
          u.name,
          resolve,
        ),
      );
      console.log('[notif] ' + u._id + ' => digest email result:', res);
    } else {
      console.log(
        '[notif] ' + u._id + ' => NO NEW NOTIFICATION since last digest',
      );
    }
  }

  // set next digest date
  cleanPref.pendEN = 0; // reset the notification counter
  const updatedUser = await new Promise((resolve) =>
    userModel.setPref(u._id, cleanPref, resolve),
  );
  console.log(
    '[notif] ' + u._id + ' => next digest date: ',
    ((updatedUser || {}).pref || {}).nextEN,
  );
}

async function worker(cb) {
  const now = new Date();
  const label = '[notif] notifEmails.worker #' + now.getTime();
  console.time(label);
  try {
    const users = await userModel.fetchEmailNotifsToSend(now);
    console.log('[notif] users to notify by email: ', users.length);
    for await (const user of users) {
      await processUser(user);
    }
    if (cb) cb();
  } catch (err) {
    cb?.(err) || console.trace('[notifyEmails.worker]', err);
  } finally {
    console.timeEnd(label);
  }
}

// for testing
/*
console.time("DIGEST TESTING");
setInterval(function(){
	console.log("");
}, 2000);
worker(function(){
	console.timeEnd("DIGEST TESTING");
});
*/

function oneAtATime(fct, msg) {
  let running = false;
  return function () {
    if (running)
      console.error(
        msg ||
          'WARNING: [OneAtATime] fct is trying to start before last call has ended',
      );
    else {
      running = true;
      fct(function () {
        running = false;
      });
    }
  };
}

if (DIGEST_INTERVAL < 0)
  console.log(
    '[notif] config.digestInterval is NULL or NEGATIVE => digest worker is disabled',
  );
else if (!timer) {
  console.log('[notif] Starting with interval', DIGEST_INTERVAL, '...');
  timer = setInterval(oneAtATime(worker), DIGEST_INTERVAL);
}
