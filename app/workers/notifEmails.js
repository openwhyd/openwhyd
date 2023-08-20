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

function processUser(u, cb) {
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

  function done() {
    // set next digest date
    cleanPref.pendEN = 0; // reset the notification counter
    userModel.setPref(u._id, cleanPref, function (updatedUser) {
      console.log(
        '[notif] ' + u._id + ' => next digest date: ',
        ((updatedUser || {}).pref || {}).nextEN,
      );
      cb();
    });
  }

  // render and send digest (if not empty)
  if (freq > 0) {
    const renderingLabel = '[notif] ' + u._id + ' rendering';
    console.log(renderingLabel, '...');
    console.time(renderingLabel);
    digest.fetchAndGenerateNotifDigest(u, options, function (email) {
      console.timeEnd(renderingLabel);
      if (email)
        emailModel.email(
          u.email,
          email.subject,
          email.bodyText,
          email.bodyHtml,
          u.name,
          function (r) {
            console.log('[notif] ' + u._id + ' => digest email result:', r);
            done();
          },
        );
      else {
        console.log(
          '[notif] ' + u._id + ' => NO NEW NOTIFICATION since last digest',
        );
        done();
      }
    });
  } else done();
}

function worker(cb) {
  const now = new Date();
  const label = '[notif] notifEmails.worker #' + now.getTime();
  console.time(label);
  userModel.fetchEmailNotifsToSend(now, function (users) {
    console.timeEnd(label);
    console.log('[notif] users to notify by email: ', users.length);
    (function next() {
      if (users && users.length) processUser(users.pop(), next);
      else if (cb) cb();
    })();
  });
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
