/**
 * testing console
 * @author adrienjoly, whyd
 **/

var fs = require("fs");
var path = require("path");
var snip = require("../../snip.js");

function loadTestFile(testName){
	var filePath = path.resolve("app/controllers/admin/tests/"+testName+".js");
	delete require.cache[filePath]; // clear the cache entry for this file before reloading it below
	try {
		return require(filePath);
	}
	catch(e) {}
}

var runTests = (function(){
	return function(tests, p, cb) {
		p = p || {};
		function returnResults(res){
			res = res || tests;
			cb(res.map(function(t){
				return t[0] + " => " + (t[2] || "(not tested)");
			}).join("\n"));
		}
		function runTest(t, cb) {
			console.log(("testing: " + t[0] + "...").blue);
			t[1](function(success){
				t.push(ok = success ? "ok" : "NOK");
				console.log((" => " + ok).blue);
				(!success && p.stopOnFail ? returnResults : cb)();
			});
		}
		snip.forEachArrayItem(tests, runTest, returnResults);
	};
})();

exports.controller = function(request, reqParams, response) {
	request.logToConsole("test.controller", reqParams = reqParams || {});
	var user = request.checkAdmin(response);
	if (false == user) return;

	if (reqParams.action) {
		var testFile = loadTestFile(reqParams.action);
		if (!testFile)
			return response.renderText("test file not found: " + reqParams.action);
		var p = {
			loggedUser: request.getUser(),
			session: request.session,
			cookie: "whydSid=" + (request.getCookies() || {})["whydSid"]
		};
		var tests = testFile.makeTests(p);
		runTests(tests, p, function(res){
			response.renderText(res);
		});
	}
	else {
		fs.readdir("app/controllers/admin/tests", function(err, files){
			response.renderHTML(files.map(function(file){
				file = file.substr(0, file.lastIndexOf("."));
				return '<li><a href="test/'+file+'">'+file+'</a>';
			}).join('\n'));
		});
	}
};
