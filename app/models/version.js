var config = require('../models/config.js');

var VERSIONS_CACHE = {
  openwhydServerVersion: config.version,
};

exports.getVersions = function () {
  return VERSIONS_CACHE;
};
