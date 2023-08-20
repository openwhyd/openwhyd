/**
 * test runner
 * @author adrienjoly
 **/

function forEachAsync(fcts, cb) {
  fcts = fcts || [];
  (function next() {
    const fct = fcts.shift();
    if (!fct) cb();
    else fct(next);
  })();
}

window.TestRunner = function () {
  const tests = [];
  let finalCallback = null;

  function wrapTest(testFct, title) {
    return function (nextTestFct) {
      console.log('%c[TEST] ' + title + ' ...', 'color:#888');
      testFct(function (res) {
        console.log(
          '%c[TEST]=> ' + (res ? 'OK' : 'FAIL: ' + title),
          'color:' + (res ? 'green' : 'red'),
        );
        if (res) setTimeout(nextTestFct);
        else finalCallback({ ok: false, title: title });
      });
    };
  }

  this.addTests = function (testMap) {
    for (const title in testMap) tests.push(wrapTest(testMap[title], title));
    return this;
  };

  this.run = function (cb) {
    finalCallback = cb;
    forEachAsync(tests, function () {
      console.log('%cAll tests done!', 'color:green');
      finalCallback({ ok: true });
    });
    return this;
  };
};
