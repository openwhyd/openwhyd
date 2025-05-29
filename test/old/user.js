// Info: moved from app/controllers/admin/tests, for security reasons.
// TODO: turn this script into a proper integration test and move it outside of the app

const snip = require('../../app/snip.js');
const config = require('../../app/models/config.js'); // {urlPrefix:"http://localhost:8000"};
const userModel = require('../../app/models/user.js');

const TEST_USER = {
  name: 'test user',
  email: process.env.WHYD_ADMIN_EMAIL,
  password: 'coco',
  // additional fields:
  handle: 'testvaliduserhandl',
};

function log() {
  console.log.apply(console, arguments);
}

function makeJsonRequest(method, cookie) {
  function makeJsonResponseHandler(cb) {
    return function (err, data, response) {
      if (typeof data == 'string')
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('ERROR: non-json response:', data);
        }
      cb(data, response);
    };
  }
  return function (url, options, cb) {
    options.method = method;
    options.headers = options.headers || {};
    options.headers.Cookie = options.cookie || cookie;
    if (options.cookie) delete options.cookie;
    snip.httpRequestWithParams(
      config.urlPrefix + url,
      options,
      makeJsonResponseHandler(cb),
    );
  };
}

exports.makeTests = function (p) {
  p.stopOnFail = true;

  const testVars = {};
  const jsonGet = makeJsonRequest('GET', p.cookie);
  const jsonPost = makeJsonRequest('POST', p.cookie);

  // api helpers

  function fetchUsersByEmail(email, cb) {
    jsonGet(
      '/admin/db/find.json',
      {
        params: {
          col: 'user',
          email: email,
        },
      },
      cb,
    );
  }
  /*
	// returns logged in user data (including md5 password)
	function fetchMe(cb){
		jsonGet("/api/user", {}, function(me){
			fetchUsersByEmail(me.email, function(me){
				cb(me[0]);
			});
		});
	}
	*/
  function fetchTestUser(cb) {
    fetchUsersByEmail(TEST_USER.email, function (res) {
      const testUser = res && res[0];
      testVars.registeredUid = (testUser || {})._id;
      if (!testUser) delete testVars.cookie;
      cb(testUser);
    });
  }

  function registerTestUser(cb) {
    jsonPost(
      '/register',
      {
        body: {
          ajax: true,
          name: TEST_USER.name,
          password: TEST_USER.password,
          email: TEST_USER.email,
        },
      },
      function (res, response) {
        // log('/register result:', res);
        testVars.registeredUid = res.uId;
        testVars.cookie = response.headers['set-cookie'][0].split(';')[0];
        cb(res.redirect && res.uId);
      },
    );
  }

  function deleteTestUser(cb) {
    log('deleting user:', testVars.registeredUid);
    jsonPost(
      '/admin/users',
      {
        body: {
          action: 'delete',
          _id: testVars.registeredUid,
        },
      },
      function () {
        fetchTestUser(function (testUser) {
          log('user deleted:', !testUser);
          cb(!testUser);
        });
      },
    );
  }

  function makeSureTestUserExists(cb) {
    fetchTestUser(function (testUser) {
      if (testUser) cb(true);
      else registerTestUser(cb);
    });
  }

  function getUser(cb) {
    //log(" == ADMIN COOKIE", p.cookie)
    //log(" == USER COOKIE", testVars.cookie)
    jsonGet('/api/user', { cookie: testVars.cookie }, cb);
  }

  const BEGIN_TEST = ['(init test user)', makeSureTestUserExists],
    END_TEST = ['(delete test user)', deleteTestUser];

  const TESTS_SIGNUP = [
    BEGIN_TEST, // CREATE TEST USER
    END_TEST, // DELETE TEST USER
    [
      'check that test user does not already exist',
      function (cb) {
        fetchTestUser(function (testUser) {
          if (testUser)
            log(
              'please delete the test user before running this test => /admin/users?action=delete&_id=' +
                testUser._id,
            );
          cb(!testUser);
        });
      },
    ],
    [
      'register without name fails',
      function (cb) {
        jsonPost(
          '/register',
          {
            body: {
              ajax: true,
            },
          },
          function (res) {
            cb(res.error == 'Please enter your name');
          },
        );
      },
    ],
    [
      'register without password fails',
      function (cb) {
        jsonPost(
          '/register',
          {
            body: {
              ajax: true,
              name: TEST_USER.name,
              email: TEST_USER.email,
            },
          },
          function (res) {
            cb(res.error == 'Please enter a password');
          },
        );
      },
    ],
    [
      'register without email fails',
      function (cb) {
        jsonPost(
          '/register',
          {
            body: {
              ajax: true,
              name: TEST_USER.name,
              password: TEST_USER.password,
            },
          },
          function (res) {
            cb(res.error == 'Please enter your email');
          },
        );
      },
    ],
    ['register test user -> redirect and uId fields', registerTestUser],
    ['user is registered in database', fetchTestUser],
    END_TEST,
  ];

  const TESTS_FETCH = [
    BEGIN_TEST,
    [
      'fetch user using API (logged as admin)',
      function (cb) {
        fetchTestUser(function (testUser) {
          jsonGet(
            '/api/user/' + testVars.registeredUid,
            {},
            function (apiUser) {
              cb(testUser._id === apiUser._id);
            },
          );
        });
      },
    ],
    [
      'fetch user using API (logged as user)',
      function (cb) {
        fetchTestUser(function (testUser) {
          userModel.processUser(testUser);
          //log("admin user", testUser);
          getUser(function (apiUser) {
            //log("api user", apiUser)
            cb(
              testUser._id === apiUser._id &&
                testUser.email === apiUser.email &&
                testUser.pref.emAdd === apiUser.pref.emAdd,
            );
          });
        });
      },
    ],
    END_TEST,
  ];

  const TESTS_USERDATA = [
    BEGIN_TEST,
    [
      'check default prefs',
      function (cb) {
        getUser(function (user) {
          cb(user.pref['emLik'] == -1);
        });
      },
    ],
    [
      'set prefs',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              'pref[emLik]': 0,
            },
          },
          function () {
            getUser(function (user) {
              cb(user.pref['emLik'] == 0);
            });
          },
        );
      },
    ],
    [
      'try to set reserved handle',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              handle: 'register',
            },
          },
          function (res) {
            cb(res.error);
          },
        );
      },
    ],
    [
      'set valid handle',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              handle: TEST_USER.handle,
            },
          },
          function (res) {
            if (res.error) cb(false);
            else
              getUser(function (user) {
                cb(user.handle == TEST_USER.handle);
              });
          },
        );
      },
    ],
    [
      'connect to twitter',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              twId: 'abc',
              twTok: 'def',
              twSec: 'ghi',
            },
          },
          function () {
            getUser(function (user) {
              cb(user.twId && user.twTok && user.twSec);
            });
          },
        );
      },
    ],
    [
      'discconnect from twitter',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              twId: '',
            },
          },
          function () {
            getUser(function (user) {
              cb(!user.twId && !user.twTok && !user.twSec);
            });
          },
        );
      },
    ],
    END_TEST,
  ];

  const TESTS_LOGIN = [
    BEGIN_TEST,
    [
      'get logged user => testUser',
      function (cb) {
        getUser(function (user, response) {
          //log("response headers", response.headers);
          const cookie = response.headers['set-cookie'][0].split(';')[0];
          log('cookie', cookie);
          log('expected cookie', testVars.cookie);
          cb(cookie === testVars.cookie);
        });
      },
    ],
    [
      'log out',
      function (cb) {
        jsonGet(
          '/login?action=logout',
          { cookie: testVars.cookie },
          function () {
            getUser(function (user, response) {
              cb(!response.headers['set-cookie']);
            });
          },
        );
      },
    ],
    [
      'try to log back in with wrong password',
      function (cb) {
        jsonGet(
          '/login',
          {
            cookie: testVars.cookie,
            params: {
              action: 'login',
              email: TEST_USER.email,
              md5: 'wrong',
            },
          },
          function () {
            getUser(function (user, response) {
              cb(!response.headers['set-cookie']);
            });
          },
        );
      },
    ],
    [
      'log back in',
      function (cb) {
        jsonGet(
          '/login',
          {
            cookie: testVars.cookie,
            params: {
              action: 'login',
              email: TEST_USER.email,
              md5: userModel.md5(TEST_USER.password),
            },
          },
          function (data, response) {
            testVars.cookie = response.headers['set-cookie'][0].split(';')[0];
            getUser(function (user, response) {
              const cookie = response.headers['set-cookie'][0].split(';')[0];
              cb(cookie === testVars.cookie);
            });
          },
        );
      },
    ],
    END_TEST,
  ];

  const TESTS_RESETPASSWORD = [
    BEGIN_TEST,
    [
      'try to reset password with wrong initial password',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              oldPwd: 'wrongpassword',
              pwd: 'newpassword',
            },
          },
          function (data) {
            cb(!!data.error);
          },
        );
      },
    ],
    /*
		["try to reset password with invalid new password", function(cb){
			jsonPost("/api/user", { cookie: testVars.cookie, body: {
				oldPwd: TEST_USER.password,
				pwd: "",
			} }, function(data, response){
				cb(!!data.error);
			});
		}],
		*/
    [
      'reset password',
      function (cb) {
        jsonPost(
          '/api/user',
          {
            cookie: testVars.cookie,
            body: {
              oldPwd: TEST_USER.password,
              pwd: TEST_USER.password.toUpperCase(),
            },
          },
          function (data) {
            log('response', data);
            cb(!data.error);
          },
        );
      },
    ],
    [
      'try to log back in with old password',
      function (cb) {
        jsonGet(
          '/login',
          {
            cookie: testVars.cookie,
            params: {
              action: 'login',
              email: TEST_USER.email,
              md5: userModel.md5(TEST_USER.password),
            },
          },
          function () {
            getUser(function (user, response) {
              cb(!response.headers['set-cookie']);
            });
          },
        );
      },
    ],
    [
      'log back in with new password',
      function (cb) {
        jsonGet(
          '/login',
          {
            cookie: testVars.cookie,
            params: {
              action: 'login',
              email: TEST_USER.email,
              md5: userModel.md5(TEST_USER.password.toUpperCase()),
            },
          },
          function (data, response) {
            testVars.cookie = response.headers['set-cookie'][0].split(';')[0];
            getUser(function (user, response) {
              const cookie = response.headers['set-cookie'][0].split(';')[0];
              cb(cookie === testVars.cookie);
            });
          },
        );
      },
    ],
    END_TEST,
  ];

  return [
    TESTS_SIGNUP,
    TESTS_FETCH,
    TESTS_USERDATA,
    TESTS_LOGIN,
    TESTS_RESETPASSWORD,
  ].reduce(function (a, b) {
    return a.concat(b);
  });
};
