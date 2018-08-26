/**
 * notification email worker: digest sender
 * sends notification emails at the selected frequency of each user
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js')
var userModel = require('../models/user.js')
var emailModel = require('../models/email.js')
var digest = require('../controllers/private/digest.js')

var DIGEST_INTERVAL = parseInt(config.digestInterval) || -1
var timer = null

function processUser (u, cb) {
  var freq = 0, cleanPref = {} // daily (by default)
  for (var i in u.pref) {
    if (i.indexOf('em') == 0 && u.pref[i] > 0) {
      freq = u.pref[i]
      cleanPref[i] = u.pref[i]
    }
  }

  // generate digest
  var options = {
    until: u.pref['prevEN'],
    frequency: userModel.EM_FREQ_LABEL[freq], // e.g. "weekly"
    includeLikes: !!cleanPref['emLik'],
    includeReposts: !!cleanPref['emAdd'],
    includeSameTracks: !!cleanPref['emSam'],
    includeSubscribers: !!cleanPref['emSub']
  }
  console.log('[DIGEST WORKER] ' + u._id + ':', JSON.stringify(options))

  function done () {
    // set next digest date
    cleanPref.pendEN = 0 // reset the notification counter
    userModel.setPref(u._id, cleanPref, function (updatedUser) {
      console.log('[DIGEST WORKER] ' + u._id + ' => next digest date: ', ((updatedUser || {}).pref || {}).nextEN)
      cb()
    })
  }

  // render and send digest (if not empty)
  if (freq > 0) {
    var renderingLabel = '[DIGEST WORKER] ' + u._id + ' rendering'
    console.log(renderingLabel, '...')
    console.time(renderingLabel)
    digest.fetchAndGenerateNotifDigest(u, options, function (email) {
      console.timeEnd(renderingLabel)
      if (email) {
        emailModel.email(u.email, email.subject, email.bodyText, email.bodyHtml, u.name, function (r) {
          console.log('[DIGEST WORKER] ' + u._id + ' => digest email result:', r)
          done()
        })
      } else {
        console.log('[DIGEST WORKER] ' + u._id + ' => NO NEW NOTIFICATION since last digest')
        done()
      }
    })
  } else { done() }
}

function worker (cb) {
  var now = new Date()
  var label = '[DIGEST WORKER] notifEmails.worker #' + now.getTime()
  console.time(label)
  userModel.fetchEmailNotifsToSend(now, function (users) {
    console.timeEnd(label)
    console.log('[DIGEST WORKER] users to notify by email: ', users.length);
    (function next () {
      if (users && users.length) { processUser(users.pop(), next) } else if (cb) { cb() }
    })()
  })
};

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

function oneAtATime (fct, msg) {
  var running = false
  return function () {
    if (running) { console.error(msg || 'WARNING: [OneAtATime] fct is trying to start before last call has ended') } else {
      running = true
      fct(function () {
        running = false
      })
    }
  }
}

if (DIGEST_INTERVAL < 0) { console.log('[DIGEST WORKER] config.digestInterval is NULL or NEGATIVE => digest worker is disabled') } else if (!timer) {
  console.log('[DIGEST WORKER] Starting with interval', DIGEST_INTERVAL, '...')
  timer = setInterval(oneAtATime(worker), DIGEST_INTERVAL)
}
