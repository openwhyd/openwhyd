(function() {
  var DEFAULT_TOKEN = '';

  // wrap console

  var origLog = console.log;

  var log = (console.log = function() {
    origLog.apply(console, arguments);
    for (var i in arguments)
      if (arguments[i] instanceof Object || arguments[i] instanceof Array)
        arguments[i] = JSON.stringify(arguments[i]);
    var p = document.createElement('p');
    if (arguments[0].indexOf('%c') == 0) {
      arguments[0] = arguments[0].substr(2);
      p.setAttribute('style', arguments[arguments.length - 1]);
      --arguments.length;
    }
    var text = Array.prototype.join.call(arguments, ' ');
    //origLog(text);
    p.innerText = text;
    document.body.appendChild(p);
    //document.body.innerHTML += ("<p>" + text.replace + "</p>");
  });

  // get and post functions

  function makeJsonResponseHandler(cb) {
    return function(res) {
      if (typeof res == 'string')
        try {
          res = JSON.parse(res);
        } catch (e) {
          log('ERROR: non-json response:', res);
        }
      cb(res);
    };
  }

  function jsonGet(url, p, cb) {
    return $.get(url, p, makeJsonResponseHandler(cb));
  }

  function jsonPost(url, p, cb) {
    return $.post(url, p, makeJsonResponseHandler(cb));
  }

  // helpers

  function countNotifs(notifs) {
    var total = 0;
    for (var i in notifs) total += notifs[i].n || 1;
    return total;
  }

  // tests

  var testVars = {};

  var TESTS = {
    'backup and clear notifications': function(cb) {
      jsonGet('/api/notif', {}, function(notifs) {
        testVars.initialNotifs = notifs;
        log('found', countNotifs(notifs), 'notifs');
        jsonPost('/api/notif', { action: 'deleteAll' }, function() {
          //setTimeout(function(){
          jsonGet('/api/notif', {}, function(notifs) {
            log('found', countNotifs(notifs), 'notifs');
            cb(!notifs.length);
          });
          //}, 1000);
        });
      });
    },
    'backup and delete apTok': function(cb) {
      jsonGet('/api/user', {}, function(me) {
        testVars.initialApTok = me.apTok;
        log('apTok:', me.apTok || '(none)');
        jsonPost('/api/user', { apTok: '' }, function() {
          jsonGet('/api/user', {}, function(me) {
            cb(!me.apTok);
          });
        });
      });
    },
    'backup and disable mnSub notif preference': function(cb) {
      jsonGet('/api/user', {}, function(me) {
        testVars.initialMnSub = me.pref.mnSub;
        log('current mnSub value:', me.pref.mnSub || '(not set)');
        jsonPost('/api/user', { 'pref[mnSub]': '-1' }, function() {
          jsonGet('/api/user', {}, function(me) {
            cb(me.pref.mnSub == '-1');
          });
        });
      });
    },
    'simulate a notif => no push': function(cb) {
      jsonPost('/api/notif', { action: 'test' }, function() {
        var result = confirm('have you received a push notification?');
        cb(!result);
      });
    },
    'check notification counter 1': function(cb) {
      jsonGet('/api/notif', {}, function(notifs) {
        var count = countNotifs(notifs);
        log('found', count, 'notifs');
        cb(count == 1);
      });
    },
    'set apTok': function(cb) {
      var token = window.prompt('What is your APNS token?', DEFAULT_TOKEN);
      jsonPost('/api/user', { apTok: token }, function() {
        jsonGet('/api/user', {}, function(me) {
          log('new token', me.apTok);
          cb(me.apTok && me.apTok[0].tok == token.replace(/ /g, ''));
        });
      });
    },
    'simulate a notif => still no push': function(cb) {
      jsonPost('/api/notif', { action: 'test' }, function() {
        var result = confirm('have you received a push notification?');
        cb(!result);
      });
    },
    'check notification counter 2': function(cb) {
      jsonGet('/api/notif', {}, function(notifs) {
        var count = countNotifs(notifs);
        log('found', count, 'notifs');
        cb(count == 2);
      });
    },
    'enable mnSub notif preference': function(cb) {
      jsonPost('/api/user', { 'pref[mnSub]': '0' }, function() {
        jsonGet('/api/user', {}, function(me) {
          cb(me.pref.mnSub == '0');
        });
      });
    },
    'simulate a notif => push to mobile': function(cb) {
      jsonPost('/api/notif', { action: 'test' }, function() {
        cb(
          confirm('have you received a push notification?') &&
            confirm(
              'is there a badge with 3 pending notifications on the openwhyd app icon?'
            )
        );
      });
    },
    'check notification counter 3': function(cb) {
      jsonGet('/api/notif', {}, function(notifs) {
        var count = countNotifs(notifs);
        log('found', count, 'notifs');
        cb(count == 3);
      });
    },
    'restore initial mnSub notif preference': function(cb) {
      jsonPost(
        '/api/user',
        { 'pref[mnSub]': testVars.initialMnSub },
        function() {
          jsonGet('/api/user', {}, function(me) {
            cb(me.pref.mnSub == testVars.initialMnSub);
          });
        }
      );
    },
    'restore apTok': function(cb) {
      jsonPost('/api/user', { apTok: '' }, function() {
        jsonPost(
          '/api/user',
          { apTok: (testVars.initialApTok.pop() || { tok: '' }).tok },
          function() {
            jsonGet('/api/user', {}, function(me) {
              log('restored initial token', me.apTok);
              cb(true);
            });
          }
        );
      });
    },
    'clear notifications': function(cb) {
      jsonPost('/api/notif', { action: 'deleteAll' }, function() {
        jsonGet('/api/notif', {}, function(notifs) {
          cb(!notifs.length);
        });
      });
    }
  };

  // init button
  document.getElementById('run').onclick = function() {
    var runner = new TestRunner();
    runner.addTests(TESTS);
    runner.run(function(result) {
      log('result of all tests:', result);
    });
  };

  // display list for tests
  var listEl = document.getElementById('tests');
  for (var t in TESTS) {
    var li = document.createElement('li');
    li.innerText = t;
    listEl.appendChild(li);
  }
})();
