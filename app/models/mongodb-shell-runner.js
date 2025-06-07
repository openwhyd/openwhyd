//@ts-check

const vm = require('vm');
const mongodb = require('mongodb');

const LOG_PREFIX = '[mongo shell]';
const TIMEOUT_MS = 2 * 60 * 1000; // two minutes

function buildContext(db, options = {}) {
  const context = {
    print: function () {
      options.print &&
        console.log.apply(
          console,
          [LOG_PREFIX].concat(Array.prototype.slice.call(arguments)),
        );
    },
    db,
    ObjectId: function (v) {
      return new mongodb.ObjectId('' + v);
    },
  };
  return context;
}

// this method runs the commands of a mongo shell script (e.g. initdb.js)
exports.runScriptOnDatabase = async function (script, db) {
  const contextObj = buildContext(db, { print: true });
  await vm.runInNewContext(
    `Promise.resolve().then(async () => { ${script} });`,
    vm.createContext(contextObj),
    { timeout: TIMEOUT_MS, microtaskMode: 'afterEvaluate' },
  );
};
