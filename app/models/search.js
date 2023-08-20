/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * generic search wrapper
 * @author adrienjoly, whyd
 **/

const config = require('./config.js');

/** @returns {void} */
exports.indexTyped = (docType, document) => {
  throw new Error('not implemented');
};

/** @returns {void} */
exports.deletePlaylist = (userId, playlistId, callback) => {
  throw new Error('not implemented');
};

/** @returns {void} */
exports.deleteDoc = (docType, playlistId) => {
  throw new Error('not implemented');
};

/** @returns {void} */
exports.indexPlaylist = (userId, playlistId, playlistName) => {
  throw new Error('not implemented');
};

if (config.searchModule)
  console.log('[search] Loading module: ' + config.searchModule + '...');
else console.log('[search] DISABLED (see config.enableSearchIndex)');

const searchImpl = config.searchModule
  ? require('./' + config.searchModule)
  : {};

const FCTS_REQUIRED = {
  init: 1,
  query: 1,
};

const FCTS_OPTIONAL = {
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
    const callback = arguments[cbPos];
    callback && callback();
  };
}

for (const methodName in FCTS_REQUIRED) {
  exports[methodName] =
    searchImpl[methodName] ||
    makeNoImplHandler(methodName, FCTS_REQUIRED[methodName]);
}

for (const methodName in FCTS_OPTIONAL)
  exports[methodName] =
    searchImpl[methodName] ||
    makeNoImplHandler(methodName, FCTS_OPTIONAL[methodName]);

exports.init();
