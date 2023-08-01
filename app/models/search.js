/**
 * generic search wrapper
 * @author adrienjoly, whyd
 **/

var config = require('./config.js');

/** @returns {void} */
exports.indexTyped = (docType, document) => {
  docType;
  document;
  throw new Error('not implemented');
};

/** @returns {void} */
exports.deletePlaylist = (userId, playlistId, callback) => {
  userId;
  playlistId;
  callback;
  throw new Error('not implemented');
};

/** @returns {void} */
exports.deleteDoc = (docType, playlistId) => {
  docType;
  playlistId;
  throw new Error('not implemented');
};

/** @returns {void} */
exports.indexPlaylist = (userId, playlistId, playlistName) => {
  userId;
  playlistId;
  playlistName;
  throw new Error('not implemented');
};

if (config.searchModule)
  console.log('[search] Loading module: ' + config.searchModule + '...');
else console.log('[search] DISABLED (see config.enableSearchIndex)');

var searchImpl = config.searchModule ? require('./' + config.searchModule) : {};

var FCTS_REQUIRED = {
  init: 1,
  query: 1,
};

var FCTS_OPTIONAL = {
  countDocs: 1,
  index: 1,
  indexBulk: 1,
  indexTyped: 2,
  indexPlaylist: 3,
  deleteDoc: 2,
  deleteAllDocs: 1,
  deletePlaylist: 2,
};

function makeNoImplHandler(methodName, cbPos) {
  return function () {
    if (config.searchModule)
      console.log('[search] NO IMPLEMENTATION for ' + methodName);
    var callback = arguments[cbPos];
    callback && callback();
  };
}

for (let methodName in FCTS_REQUIRED) {
  exports[methodName] =
    searchImpl[methodName] ||
    makeNoImplHandler(methodName, FCTS_REQUIRED[methodName]);
}

for (let methodName in FCTS_OPTIONAL)
  exports[methodName] =
    searchImpl[methodName] ||
    makeNoImplHandler(methodName, FCTS_OPTIONAL[methodName]);

exports.init();
