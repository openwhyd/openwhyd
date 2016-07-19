// = = = = = = = = = = = = = = = = = = = = = = =
//      DEPRECATED -- KEPT FOR REFERENCE
// = = = = = = = = = = = = = = = = = = = = = = =
// please use /admin/test/user_register instead
// = = = = = = = = = = = = = = = = = = = = = = =

(function(){

	var TEST_USER = {
		name: "test user",
		email: process.env.WHYD_ADMIN_EMAIL,
		password: "coco",
	};

	// wrap console

	var origLog = console.log;

	var log = console.log = function(){
		origLog.apply(console, arguments);
		for (var i in arguments)
			if (arguments[i] instanceof Object || arguments[i] instanceof Array)
				arguments[i] = JSON.stringify(arguments[i]);
		var p = document.createElement("p");
		if (arguments[0].indexOf("%c") == 0) {
			arguments[0] = arguments[0].substr(2);
			p.setAttribute("style", arguments[arguments.length-1]);
			--arguments.length;
		}
		var text = Array.prototype.join.call(arguments, " ");
		//origLog(text);
		p.innerText = text;
		document.body.appendChild(p);
		//document.body.innerHTML += ("<p>" + text.replace + "</p>");
	};

	// get and post functions

	function makeJsonResponseHandler(cb){
		return function(res){
			if (typeof res == "string") try {
				res = JSON.parse(res);
			} catch(e) {
				log("ERROR: non-json response:", res);
			};
			cb(res);
		};
	}

	function jsonGet(url, p, cb){
		return $.get(url, p, makeJsonResponseHandler(cb));
	}

	function jsonPost(url, p, cb){
		return $.post(url, p, makeJsonResponseHandler(cb));
	}

	// api helpers

	function fetchUsersByEmail(email, cb){
		jsonGet("/admin/db/find.json", {
			col: "user",
			email: email
		}, cb);
	}

	// returns logged in user data (including md5 password)
	function fetchMe(cb){
		jsonGet("/api/user", {}, function(me){
			fetchUsersByEmail(me.email, function(me){
				cb(me[0]);
			});
		});
	}

	// tests

	var TESTS = {
		"check that test user does not already exist": function(cb){
			fetchUsersByEmail(TEST_USER.email, function(res) {
				cb(res.length == 0);
			});
		},
		"register without name fails": function(cb){
			jsonPost("/register", {
				ajax: true,
			}, function(res) {
				cb(res.error == "Please enter your name");
			});
		},
		"register without password fails": function(cb){
			jsonPost("/register", {
				ajax: true,
				name: TEST_USER.name,
				email: TEST_USER.email,
			}, function(res) {
				cb(res.error == "Please enter a password");
			});
		},
		"register without email fails": function(cb){
			jsonPost("/register", {
				ajax: true,
				name: TEST_USER.name,
				password: TEST_USER.password,
			}, function(res) {
				cb(res.error == "Please enter your email");
			});
		},
		"register test user -> redirect and uId fields": function(cb){
			jsonPost("/register", {
				ajax: true,
				name: TEST_USER.name,
				password: TEST_USER.password,
				email: TEST_USER.email,
			}, function(res) {
				log("/register result:", res);
				var registered = res.redirect && res.uId;
				if (registered) {
					log("WARNING: you're now logged as test user (not admin anymore)");
				}
				cb(registered);
			});
		},
	};

	var TESTS2 = {
		"check that test user does not already exist": function(cb){
			fetchUsersByEmail(TEST_USER.email, function(res) {
				cb(res.length == 0);
			});
		},
		"register test user -> all user fields": function(cb){
			jsonPost("/register", {
				ajax: true,
				includeUser: true,
				name: TEST_USER.name,
				password: TEST_USER.password,
				email: TEST_USER.email,
			}, function(res) {
				log("/register result:", res);
				var registered = res.redirect && res.uId;
				if (registered) {
					log("WARNING: you're now logged as test user (not admin anymore)");
				}
				cb(registered);
			});
		},
	};

	//fetchMe(log);

	document.getElementById("run").onclick = function(){
		var runner = new TestRunner();
		runner.addTests(TESTS);
		runner.run(function(result){
			log("result of all tests:", result);
		});
	};

	document.getElementById("run2").onclick = function(){
		var runner = new TestRunner();
		runner.addTests(TESTS2);
		runner.run(function(result){
			log("result of all tests:", result);
		});
	};

	document.getElementById("delete").onclick = function(){
		fetchUsersByEmail(TEST_USER.email, function(res) {
			if (!res || res.length != 1) {
				log("unexpected result while finding test user:", res);
			}
			else
				jsonPost("/admin/users", {
					action: "delete",
					_id: res[0]._id
				}, function(res) {
					log("deleted test user:", res);
				});
		});
	};

})();
