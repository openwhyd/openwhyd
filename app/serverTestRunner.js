var util = require('util');
var async = require('async');
var EventEmitter = require('events').EventEmitter;

exports.TestLogger = function () {
  var out = [];

  this.blank = function () {
    console.log('');
    out.push('');
  };

  this.log = function () {
    for (let i in arguments)
      if (arguments[i] instanceof Object || arguments[i] instanceof Array)
        arguments[i] = util.inspect(arguments[i]);
    var message = Array.prototype.join.call(arguments, ' ');
    console.log('test log:', message);
    out.push(message);
  };

  this.flush = function () {
    return out;
  };

  return this;
};

exports.ServerTestRunner = function () {
  var tests = [];

  function wrapTest(fct) {
    return function (p, ee = new EventEmitter(), cb) {
      process.nextTick(function () {
        fct(p, ee, cb);
      });
      return ee;
    };
  }

  this.addTest = function (title, fct) {
    //tests.push(wrapTest(testMap[title], title));
    tests[title] = wrapTest(fct, title);
    return this;
  };

  this.addTests = function (testMap) {
    for (let title in testMap) this.addTest(title, testMap[title]);
    return this;
  };

  function makeTestSet(tests) {
    return function (p, ee = new EventEmitter(), cb) {
      var testSeq = [];
      Object.keys(tests).map(function (testId) {
        var testFct = tests[testId];
        if (typeof testFct !== 'function')
          console.log(testId + ' is not a test => skipping');
        else
          testSeq.push(function (testCb) {
            ee.emit('blank');
            ee.emit('log', 'running ' + testId + '...');
            testFct(p, ee, testCb);
          });
      });
      process.nextTick(function () {
        ee.emit('log', 'running all ' + testSeq.length + ' tests...');
        async.series(testSeq, cb);
      });
      return ee;
    };
  }

  this.run = function (testId, p, render) {
    var test = testId == 'all' ? tests : tests[testId];
    if (!test)
      return render(
        null,
        Object.keys(tests)
          .map(function (testId) {
            return '/test/' + testId;
          })
          .join('\n')
      );
    if (typeof test === 'object') test = makeTestSet(tests);
    var logger = new exports.TestLogger();
    var log = logger.log.bind(logger);
    test(p, null, function (err, res) {
      logger.blank();
      if (err || !res) {
        log('x test failed...');
        if (err) log('  error:', err);
      } else {
        log('√ test passed!');
        if (res !== true) log('  result:', res);
      }
      render(null, logger.flush().join('\n'));
    })
      .on('log', log)
      .on('blank', logger.blank.bind(logger));
  };

  return this;
};
