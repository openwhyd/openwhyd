/**
 * hotSnapshot worker
 * updates the `prev` score, every sunday morning.
 * necessary for setting the trend arrows on the hot tracks page.
 * @author adrienjoly, whyd
 **/

var trackModel = require('../models/track.js');

var CHECK_INTERVAL = 60000; // check every minute
var DAY = 0,
  HOUR = 8,
  MIN = 0; // activate every sunday at 8am

function check() {
  var now = new Date();
  if (
    now.getDay() == DAY &&
    now.getHours() == HOUR &&
    now.getMinutes() == MIN
  ) {
    console.log(
      '[HOT SNAPSHOT WORKER] ===',
      now,
      '=> refreshing hot track trends...'
    );
    trackModel.snapshotTrackScores(function(r) {
      console.log(
        '[HOT SNAPSHOT WORKER] snapshotTrackScores => ',
        r || { ok: 'done' }
      );
    });
  }
}

console.log('[HOT SNAPSHOT WORKER] Starting with interval ...');
setInterval(check, CHECK_INTERVAL);
