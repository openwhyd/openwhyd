var async = require("async");
var snip = require("../../../snip.js");
var config = require("../../../models/config.js"); // {urlPrefix:"http://localhost:8000"};
var userModel = require("../../../models/user.js");
var postModel = require("../../../models/post.js");

var TEST_USER = {
	name: "test user",
	email: process.env.WHYD_ADMIN_EMAIL,
	password: "coco",
	// additional fields:
	handle: "testvaliduserhandl",
	fbId: "1",
	apTok: "00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000",
};

function log(){
	console.log.apply(console, arguments);
}

function makeJsonRequest(method, cookie){
	function makeJsonResponseHandler(cb){
		return function(err, data, response){
			if (typeof data == "string") try {
				data = JSON.parse(data);
			} catch(e) {
				console.error("ERROR: non-json response:", data);
			};
			cb(data, response);
		};
	};
	return function(url, options, cb){
		options.method = method;
		options.headers = options.headers || {};
		options.headers.Cookie = options.cookie || cookie;
		if (options.cookie)
			delete options.cookie;
		snip.httpRequestWithParams(config.urlPrefix + url, options, makeJsonResponseHandler(cb));
	};
}

exports.makeTests = function(p){

	p.stopOnFail = true;

	var testVars = {};
	var jsonGet = makeJsonRequest("GET", p.cookie);
	var jsonPost = makeJsonRequest("POST", p.cookie);

	// api helpers

	function fetchUsersByEmail(email, cb){
		jsonGet("/admin/db/find.json", {params:{
			col: "user",
			email: email
		}}, cb);
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
	function fetchTestUser(cb){
		fetchUsersByEmail(TEST_USER.email, function(res) {
			var testUser = res && res[0];
			testVars.registeredUid = (testUser || {})._id;
			if (!testUser)
				delete testVars.cookie;
			cb(testUser);
		});
	}

	function registerTestUser(cb){
		jsonPost("/register", {body:{
			ajax: true,
			name: TEST_USER.name,
			password: TEST_USER.password,
			email: TEST_USER.email,
			fbId: TEST_USER.fbId,
		}}, function(res, response) {
			log("/register result:", res);
			testVars.registeredUid = res.uId;
			testVars.cookie = response.headers["set-cookie"][0].split(";")[0];
			cb(res.redirect && res.uId);
		});
	}

	function deleteTestUser(cb){
		log("deleting user:", testVars.registeredUid);
		jsonPost("/admin/users", {body:{
			action: "delete",
			_id: testVars.registeredUid
		}}, function(res) {
			fetchTestUser(function(testUser) {
				log("user deleted:", !testUser);
				cb(!testUser);
			});
		});
	}

	function makeSureTestUserExists(cb){
		fetchTestUser(function(testUser) {
			if (testUser)
				cb(true);
			else
				registerTestUser(cb);
		});
	}

	function getUser(cb){
		//log(" == ADMIN COOKIE", p.cookie)
		//log(" == USER COOKIE", testVars.cookie)
		jsonGet("/api/user", {cookie: testVars.cookie}, cb);
	}

	var BEGIN_TEST = ["(init test user)", makeSureTestUserExists],
		END_TEST = ["(delete test user)", deleteTestUser];

	var TESTS_SIGNUP = [
		BEGIN_TEST, // CREATE TEST USER
		END_TEST, // DELETE TEST USER
		["check that test user does not already exist", function(cb){
			fetchTestUser(function(testUser) {
				if (testUser)
					log("please delete the test user before running this test => /admin/users?action=delete&_id=" + testUser._id);
				cb(!testUser);
			});
		}],
		["register without name fails", function(cb){
			jsonPost("/register", {body:{
				ajax: true,
			}}, function(res) {
				cb(res.error == "Please enter your name");
			});
		}],
		["register without password fails", function(cb){
			jsonPost("/register", {body:{
				ajax: true,
				name: TEST_USER.name,
				email: TEST_USER.email,
			}}, function(res) {
				cb(res.error == "Please enter a password");
			});
		}],
		["register without email fails", function(cb){
			jsonPost("/register", {body:{
				ajax: true,
				name: TEST_USER.name,
				password: TEST_USER.password,
			}}, function(res) {
				cb(res.error == "Please enter your email");
			});
		}],
		["register with invalid facebook id fails", function(cb){
			jsonPost("/register", {body:{
				ajax: true,
				name: TEST_USER.name,
				email: TEST_USER.email,
				password: TEST_USER.password,
				fbId: "unexisting/../../../../../../../../../../windows/win.ini.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\.\\",
			}}, function(res) {
				cb(res.error == "Invalid Facebook id");
			});
		}],
		["register test user -> redirect and uId fields", registerTestUser],
		["user is registered in database", fetchTestUser],
		END_TEST
	];

	var TESTS_FETCH = [
		BEGIN_TEST,
		["fetch user using API (logged as admin)", function(cb){
			fetchTestUser(function(testUser){
				jsonGet("/api/user/" + testVars.registeredUid, {}, function(apiUser){
					cb(testUser._id === apiUser._id);
				});
			});
		}],
		["fetch user using API (logged as user)", function(cb){
			fetchTestUser(function(testUser){
				userModel.processUser(testUser);
				//log("admin user", testUser);
				getUser(function(apiUser){
					//log("api user", apiUser)
					cb(testUser._id === apiUser._id &&
						testUser.email === apiUser.email &&
						testUser.pref.emAdd === apiUser.pref.emAdd);
				});
			});
		}],
		END_TEST,
	];

	var TESTS_USERDATA = [
		BEGIN_TEST,
		["check default prefs", function(cb){
			getUser(function(user){
				cb(user.pref["emLik"] == -1);
			});
		}],
		["set prefs", function(cb){
			jsonPost("/api/user", {
				cookie: testVars.cookie,
				body: {
					"pref[emLik]": 0
				}
			}, function(){
				getUser(function(user){
					cb(user.pref["emLik"] == 0);
				});
			});
		}],
		["try to set reserved handle", function(cb){
			jsonPost("/api/user", {
				cookie: testVars.cookie,
				body: {
					"handle": "register"
				}
			}, function(res){
				cb(res.error);
			});
		}],
		["set valid handle", function(cb){
			jsonPost("/api/user", {
				cookie: testVars.cookie,
				body: {
					"handle": TEST_USER.handle
				}
			}, function(res){
				if (res.error)
					cb(false);
				else
					getUser(function(user){
						cb(user.handle == TEST_USER.handle);
					});
			});
		}],
		["set invalid apple push notification token", function(cb){
			jsonPost("/api/user", { cookie: testVars.cookie, body: { "apTok": "pouet" } }, function(res){
				//log("apTok set ->", res);
				getUser(function(user){
					cb(!user.apTok);
				});
			});
		}],
		["set valid apple push notification token", function(cb){
			jsonPost("/api/user", { cookie: testVars.cookie, body: { "apTok": TEST_USER.apTok } }, function(res){
				getUser(function(user){
					//log("user", user);
					cb(user.apTok[0].tok === TEST_USER.apTok.replace(/ /g, ""));
				});
			});
		}],
		["connect to twitter", function(cb){
			jsonPost("/api/user", {
				cookie: testVars.cookie,
				body: {
					"twId": "abc",
					"twTok": "def",
					"twSec": "ghi"
				}
			}, function(res){
				getUser(function(user){
					cb(user.twId && user.twTok && user.twSec);
				});
			});
		}],
		["discconnect from twitter", function(cb){
			jsonPost("/api/user", {
				cookie: testVars.cookie,
				body: {
					"twId": "",
				}
			}, function(res){
				getUser(function(user){
					cb(!user.twId && !user.twTok && !user.twSec);
				});
			});
		}],
		END_TEST,
	];

	var TESTS_LOGIN = [
		BEGIN_TEST,
		["get logged user => testUser", function(cb){
			getUser(function(user, response){
				//log("response headers", response.headers);
				var cookie = response.headers["set-cookie"][0].split(";")[0];
				log("cookie", cookie);
				log("expected cookie", testVars.cookie);
				cb(cookie === testVars.cookie);
			});
		}],
		["log out", function(cb){
			jsonGet("/login?action=logout", { cookie: testVars.cookie }, function(data, response){
				getUser(function(user, response){
					cb(!response.headers["set-cookie"]);
				});
			});
		}],
		["try to log back in with wrong password", function(cb){
			jsonGet("/login", { cookie: testVars.cookie, params: {
				action: "login",
				email: TEST_USER.email,
				md5: "wrong",
			} }, function(data, response){
				getUser(function(user, response){
					cb(!response.headers["set-cookie"]);
				});
			});
		}],
		["log back in", function(cb){
			jsonGet("/login", { cookie: testVars.cookie, params: {
				action: "login",
				email: TEST_USER.email,
				md5: userModel.md5(TEST_USER.password),
			} }, function(data, response){
				testVars.cookie = response.headers["set-cookie"][0].split(";")[0];
				getUser(function(user, response){
					var cookie = response.headers["set-cookie"][0].split(";")[0];
					cb(cookie === testVars.cookie);
				});
			});
		}],
		END_TEST,
	];

	var TESTS_RESETPASSWORD = [
		BEGIN_TEST,
		["try to reset password with wrong initial password", function(cb){
			jsonPost("/api/user", { cookie: testVars.cookie, body: {
				oldPwd: "wrongpassword",
				pwd: "newpassword",
			} }, function(data, response){
				cb(!!data.error);
			});
		}],
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
		["reset password", function(cb){
			jsonPost("/api/user", { cookie: testVars.cookie, body: {
				oldPwd: TEST_USER.password,
				pwd: TEST_USER.password.toUpperCase(),
			} }, function(data, response){
				log("response", data)
				cb(!data.error);
			});
		}],
		["try to log back in with old password", function(cb){
			jsonGet("/login", { cookie: testVars.cookie, params: {
				action: "login",
				email: TEST_USER.email,
				md5: userModel.md5(TEST_USER.password),
			} }, function(data, response){
				getUser(function(user, response){
					cb(!response.headers["set-cookie"]);
				});
			});
		}],
		["log back in with new password", function(cb){
			jsonGet("/login", { cookie: testVars.cookie, params: {
				action: "login",
				email: TEST_USER.email,
				md5: userModel.md5(TEST_USER.password.toUpperCase()),
			} }, function(data, response){
				testVars.cookie = response.headers["set-cookie"][0].split(";")[0];
				getUser(function(user, response){
					var cookie = response.headers["set-cookie"][0].split(";")[0];
					cb(cookie === testVars.cookie);
				});
			});
		}],
		END_TEST,
	];

	var TESTS_ONBOARDING = [
		BEGIN_TEST,
		["(loading) wait for tag library...", function(cb){
			require("../../../models/plTags.js").getTagEngine(function(plTags){
				var nbUsers = Object.keys((plTags || {}).uidToTagSet || {}).length;
				console.log("nbUsers", nbUsers);
				cb(nbUsers > 0);
			});
		}],
		["fetch at least one suggested user, based on genre tags", function(cb){
			jsonPost("/onboarding", { cookie: testVars.cookie, body: {
				ajax: "people",
				genres: "Electro,Indie,Reggae,World",
			} }, function(data, response){
				var users = data || [], sum = 0;
				for (var i in users)
					sum += users[i].score;
				var avgScore = sum / users.length;
				console.log("avgScore", avgScore);
				cb((data || []).length > 0);
			});
		}],
		["check that suggested users have posted less than 2 weeks ago", function(cb){
			var TWO_WEEKS = 2 * 7 * 24 * 60 * 60 * 1000, now = Date.now();
			function fetchLastPost(uId, cb){
				postModel.fetchPosts({uId: uId}, {}, {limit: 1}, function(posts){
					cb(null, (posts || []).shift());
				});
			}
			function wasPostedWithin(delay, post){
				return post && (now - post._id.getTimestamp() < delay);
			}
			function sum(a, b){
				return a + b;
			}
			function processUsers(users){
				users = users || [];
				async.mapSeries(users, function(user, cb){
					fetchLastPost(user.id, cb);
				}, function(err, res){
					var withinTwoWeeks = res.map(wasPostedWithin.bind(null, TWO_WEEKS)).reduce(sum);
					console.log("suggested users who posted within the last two weeks:", withinTwoWeeks, "/", users.length);
					cb(withinTwoWeeks == users.length);
				});
			}
			jsonPost("/onboarding", { cookie: testVars.cookie, body: {
				ajax: "people",
				genres: "Electro,Indie,Reggae,World",
			} }, processUsers);
		}],
		END_TEST,
	];

	/*
		["set adrien's apple push notification token", function(cb){
			jsonPost("/api/user", { body: { "apTok": "07e3570a 8393f53e b868f627 766ea900 88c243a2 4f842051 769ad757 4ed10d7b" } }, function(res){
				cb(!!res);
			});
		}],
		["set adrien's apple push preferences", function(cb){
			jsonPost("/api/user", { body: { "pref[mnLik]": 0 } }, function(res){
				cb(!!res);
			});
		}],
		["disable adrien's apple push preferences", function(cb){
			jsonPost("/api/user", { body: { "pref[mnLik]": -1 } }, function(res){
				cb(!!res);
			});
		}],
	*/

	return [
		TESTS_SIGNUP,
		TESTS_FETCH,
		TESTS_USERDATA,
		TESTS_LOGIN,
		TESTS_RESETPASSWORD,
		TESTS_ONBOARDING,
	].reduce(function(a,b){
		return a.concat(b);
	});
}
