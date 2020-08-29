/**
 * trackMatcher model
 * evaluates the distance / similarity between two tracks, based on how their names and durations match.
 */

var assert = require('assert');
var snip = require('../snip.js');

var DEFAULT_NAME_TOLERANCE = 5; // 5 => 4 chars difference = 50% confidence
var DEFAULT_DURATION_TOLERANCE = 8; // 8 seconds difference = 50% confidence

// returns the combination/order of artistName and trackTitle that is the closest to targetName + its distance
function getBestTitle(track, targetName) {
  var comb = [
    track.artistName + ' ' + track.trackTitle,
    track.trackTitle + ' ' + track.artistName,
  ].map(function (combinedName) {
    return [
      combinedName,
      snip.getLevenshteinDistance(combinedName, targetName),
    ];
  });
  return comb[0][1] <= comb[1][1] ? comb[0] : comb[1];
}

function getTrackTitle(track) {
  assert.ok(track);
  var richMeta = track.artistName && track.trackTitle;
  assert.ok(
    track.name || richMeta,
    'no title found for track: ' + JSON.stringify(track)
  );
  return track.artistName && track.trackTitle
    ? [track.artistName, track.trackTitle].join(' - ')
    : track.name;
}

function Dist(track, hit) {
  this.targetName = getTrackTitle(track);
  this.hitTrackName = getTrackTitle(hit);
  this.targetDuration = track.duration;
  this.hitTrackDuration = hit.duration;
  return this;
}
Dist.prototype.toString = function (prefix) {
  var prefix = prefix || '';
  return [
    prefix +
      'track: ' +
      this.targetName +
      ' (' +
      this.targetDuration +
      ' seconds)',
    prefix +
      'hit  : ' +
      this.hitTrackName +
      ' (' +
      this.hitTrackDuration +
      ' seconds)',
    prefix +
      '=> name distance: ' +
      this.nameDistance +
      ' + duration distance: ' +
      this.durationDistance +
      ('confidence' in this ? ' => confidence: ' + this.confidence : ''),
  ].join('\n');
};

function TrackMatcher(track) {
  // constants
  this.NAME_TOLERANCE = DEFAULT_NAME_TOLERANCE;
  this.DURATION_TOLERANCE = DEFAULT_DURATION_TOLERANCE;
  // private vars
  var richTrack = track.artistName && track.trackTitle;
  // returns distances between the track and the given hit
  this.evalDistances = function (hit) {
    var dist = new Dist(track, hit);
    var richHit = hit.artistName + hit.trackTitle;
    // 1) compare names
    if (richTrack && richHit) {
      dist.nameDistance =
        snip.getLevenshteinDistance(track.artistName, hit.artistName) +
        snip.getLevenshteinDistance(track.trackTitle, hit.trackTitle);
    } else if (richHit) {
      var comb = getBestTitle(hit, dist.targetName);
      dist.hitTrackName = comb[0];
      dist.nameDistance = comb[1];
    } else if (richTrack) {
      var comb = getBestTitle(track, dist.hitTrackName);
      dist.targetName = comb[0];
      dist.nameDistance = comb[1];
    } else {
      dist.nameDistance = snip.getLevenshteinDistance(
        dist.targetName,
        dist.hitTrackName
      );
    }
    // 2) compare names
    if (track.duration && hit.duration) {
      dist.durationDistance = Math.abs(track.duration - hit.duration);
    }
    return dist;
  };
  // returns confidence (0.0-1.0) using levenshtein distance between queried track metadata and hit.
  this.evalConfidence = function (hit, dist) {
    dist = /*hit._dist =*/ dist || this.evalDistances(hit);
    dist.durationDistance =
      dist.durationDistance || this.DURATION_TOLERANCE / 2;
    dist.distance = dist.nameDistance + dist.durationDistance;
    // based on: https://docs.google.com/spreadsheets/d/1sp3qSA_qMcX7T7LCH4WKyIO3gTppTxoG4f7zdBOyuMA/edit#gid=1689142993
    var nameConfidence =
      1 + (1 - Math.pow(2, dist.nameDistance)) / this.NAME_TOLERANCE;
    var durationConfidence =
      1 - dist.durationDistance / this.DURATION_TOLERANCE;
    dist.confidence = Math.min(
      Math.max((nameConfidence + durationConfidence) / 2, 0.0),
      1.0
    );
    return dist;
  };
  return this;
}

exports.getTrackTitle = getTrackTitle;
exports.getBestTitle = getBestTitle;
exports.TrackMatcher = TrackMatcher;
