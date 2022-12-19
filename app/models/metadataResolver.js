/**
 * metadataResolver API
 * extracts track metadata and mappings, using music APIs
 */

var deezerApi = require('../models/deezer.js');
var TrackMatcher = require('../models/trackMatcher.js').TrackMatcher;

// source-specific metadata extractors => highly accurate artist name and title, or none
// each module must implement the fetchTrackMetadata() method
var EXTRACTORS = {
  en: require('../models/echonest.js'),
  yt: require('../models/youtube.js'),
  sc: require('../models/soundcloud.js'),
  sp: require('../models/spotify.js'),
  dz: require('../models/deezer.js'),
};
