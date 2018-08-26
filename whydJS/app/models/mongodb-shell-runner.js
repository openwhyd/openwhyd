var vm = require('vm');
var async = require('async');
var mongodb = require('mongodb');

const VERBOSE = false; // true to display debug logs (for diagnostics and testing)
const LOG_PREFIX = '[mongo shell]';

function buildContext(db, nextCommand, callback) {
  function makeCallback(prefix, callback) {
    return function(err, res) {
      VERBOSE &&
        console.log(LOG_PREFIX, 'db.' + prefix, '=>', err ? err.errmsg : 'ok');
      nextCommand();
    };
  }

  var context = {
    print: function() {
      console.log.apply(
        console,
        [LOG_PREFIX].concat(Array.prototype.slice.call(arguments))
      );
      nextCommand();
    },
    db: {
      createCollection: function(colName) {
        db.createCollection(colName, {}, makeCallback('db.createCollection'));
      }
      // + one property per collection will be populated
    },
    ObjectId: function(v) {
      try {
        return mongodb.ObjectID.createFromHexString('' + v);
      } catch (e) {
        console.warn('invalid mongodb object id:' + v);
        return 'invalid_id';
      }
    }
  };

  function wrapCollectionMethod(col, methodName, colName) {
    return function() {
      return col[methodName].apply(
        col,
        Array.prototype.slice
          .call(arguments)
          .concat([makeCallback(colName + '.' + methodName)])
      );
    };
  }

  function wrapCollection(colName, callback, commandCallback) {
    db.collection(colName, function(err, col) {
      callback(
        err,
        !err && {
          dropIndex: wrapCollectionMethod(col, 'dropIndex', colName),
          ensureIndex: wrapCollectionMethod(col, 'ensureIndex', colName),
          update: wrapCollectionMethod(col, 'update', colName)
        }
      );
    });
  }

  db.collections(function(err, collections) {
    if (err) throw err;
    async.eachSeries(
      collections,
      function(colObj, nextCollection) {
        // for each collection:
        wrapCollection(
          colObj.collectionName,
          function(err, res) {
            if (err) throw err;
            context.db[colObj.collectionName] = res; // mutating the context object
            nextCollection();
          },
          nextCommand
        );
      },
      function(err, res) {
        callback(err, context);
      }
    );
  });
}

// this method runs the commands of a mongo shell script (e.g. initdb.js)
exports.runScriptOnDatabase = function(script, db, callback) {
  var commands = script.toString().split(';'); // warning: some commands are multi-line
  async.eachSeries(
    commands,
    function(command, nextCommand) {
      command = command.trim();
      if (!command || /^\/\//.test(command) || /^\/\*.*\*\/$/.test(command)) {
        VERBOSE && console.log(LOG_PREFIX, 'IGN', command);
        nextCommand();
      } else {
        VERBOSE && console.log(LOG_PREFIX, 'RUN', command);
        buildContext(db, nextCommand, function(err, context) {
          // when all collections are wrapped => run the current command
          if (err) throw err;
          new vm.Script(command).runInContext(vm.createContext(context));
        });
      }
    },
    callback
  );
};
