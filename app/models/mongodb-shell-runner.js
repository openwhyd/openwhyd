var vm = require('vm');
var mongodb = require('mongodb');

const PRINT_ACTIVE = false;
const LOG_PREFIX = '[mongo shell]';

function buildContext(db, callback) {
  const context = {
    print: function () {
      PRINT_ACTIVE &&
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
  callback(null, context);
}

// this method runs the commands of a mongo shell script (e.g. initdb.js)
exports.runScriptOnDatabase = function (script, db, callback) {
  buildContext(db, function (err, context) {
    if (err) {
      callback(err);
      return;
    };
    new vm.Script(script).runInContext(vm.createContext(context));
  });
  callback();
};
