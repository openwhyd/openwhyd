/**
 * hotSnapshot worker
 * updates the `prev` score, every sunday morning.
 * necessary for setting the trend arrows on the hot tracks page.
 * @author adrienjoly, whyd
 **/

const trackModel = require('../models/track.js');

const CHECK_INTERVAL = 60000; // check every minute
const DAY = 0,
  HOUR = 8,
  MIN = 0; // activate every sunday at 8am

function check() {
  const now = new Date();
  if (
    now.getDay() == DAY &&
    now.getHours() == HOUR &&
    now.getMinutes() == MIN
  ) {
    console.log('[hot-tracks] ===', now, '=> refreshing hot track trends...');
    trackModel.snapshotTrackScores(function (r) {
      console.log('[hot-tracks] snapshotTrackScores => ', r || { ok: 'done' });
    });
  }
}

console.log('[hot-tracks] Starting with interval ...');
setInterval(check, CHECK_INTERVAL);
