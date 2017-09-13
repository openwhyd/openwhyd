// usage: run from http://localhost:8080/admin/test
// TODO: turn this script into a proper integration test and move it outside of the app

var querystring = require("querystring");
var snip = require("../../../snip.js");
var config = require("../../../models/config.js"); // {urlPrefix:"http://localhost:8000"};

function makeResponseHandler(cb){
	return function(err, res, responseData){
		var result = {
			statusCode: responseData.statusCode
		};
		if (err)
			result.error = err;
		else {
			result.response = res;
			try {
				result.response = JSON.parse(res);
			} catch (e) {
				console.error(e);
			}
		}
		cb(result);
	};
}

function makeRequest(cookie){
	return function(url, options, cb){
		(options.headers = options.headers || {}).Cookie = cookie;
		if (options.body) {
			options.method = "post";
			options.body = typeof options.body == "object" ? querystring.stringify(options.body) : options.body;
			options.headers["Content-Type"] = "application/x-www-form-urlencoded";
			options.headers["Content-Length"] = options.body.length;
		}
		snip.httpRequest(config.urlPrefix + url, options, makeResponseHandler(cb));
	};
}

exports.makeTests = function(p){
	var req = makeRequest(p.cookie);
	var testVars = {};
	return [
		//["/me should redirect", "/me?format=json", {}, function(res, cb){ cb(res.statusCode == 307); }],
		//["/api/user provides user data", "/api/user?format=json", {}, function(res, cb){ cb(res.response.name == "Adrien Joly"); }],
		[ "create a playlist", function(cb){
			req("/api/playlist", {body:{action:"create", name:"(testAPI)"}}, function(res){
				testVars.pl = res.response;
				cb(testVars.pl.id > -1);
			});
		}],
		["check that playlist exists", function(cb){
			req("/api/user?format=json", {}, function(res){
				var lastPl = {};
				try {
					lastPl = res.response.pl.shift();
				} catch (e) {
					console.error(e);
				};
				cb(lastPl.id == testVars.pl.id && lastPl.name == testVars.pl.name);
			});
		}],
		["delete playlist", function(cb){
			req("/api/playlist", {body:{action:"delete", id:testVars.pl.id}}, function(res){
				console.log("RES", res);
				cb(true);
			});
		}],
		["check that playlist does not exists", function(cb){
			req("/api/user?format=json", {}, function(res){
				var lastPl = {};
				try {
					lastPl = res.response.pl.shift();
				} catch (e) {
					console.error(e);
				};
				cb(lastPl.id != testVars.pl.id);
				delete testVars.pl;
			});
		}],
	];
}