/**
 * snippet tester
 * @author adrienjoly, whyd
 **/

var snip = require("../app/snip.js");
var testRunner = new require("../app/serverTestRunner.js").ServerTestRunner();

function handler(err, res){
	//ee.emit("log", "http response:", res.error || res.data.id);
}

testRunner.addTest("httpRequest returns a non-null value for google.com", function(p, ee, cb){
	var success = snip.httpRequest("https://google.com/", {}, handler);
	cb(!success);
});

testRunner.addTest("google.com requests can be run simultaneously", function(p, ee, cb){
	var url = "https://google.com/";
	var req1 = snip.httpRequest(url, {}, handler);
	var req2 = snip.httpRequest(url, {}, handler);
	var success = req1 && req2;
	cb(!success);
});

testRunner.addTest("youtube.com requests can be run simultaneously, until limiter is set", function(p, ee, cb){
	var url = "https://gdata.youtube.com/feeds/api/videos/7vlElmIWmNo?v=2&alt=jsonc";
	var req1 = snip.httpRequestJSON(url, {}, handler);
	var req2 = snip.httpRequestJSON(url, {}, handler);
	var success = req1 && req2;
	snip.httpSetDomain(/youtube\.com/, { queue: [] });
	cb(!success);
});

testRunner.addTest("youtube.com requests are run sequentially, after limiter is set", function(p, ee, cb){
	var url = "https://gdata.youtube.com/feeds/api/videos/7vlElmIWmNo?v=2&alt=jsonc";
	var req1 = snip.httpRequestJSON(url, {}, handler);
	var req2 = snip.httpRequestJSON(url, {}, function(err, res){
		var success = req1 && !req2 && res.data.id == "7vlElmIWmNo";
		cb(!success);
	});
});

testRunner.addTest("youtube.com requests call back exactly once per call, after limiter is set", function(p, ee, cb){
	var url = "https://gdata.youtube.com/feeds/api/videos/7vlElmIWmNo?v=2&alt=jsonc";
	var count = 0;
	function counter(cb){
		return function(err, res){
			++count;
			cb && cb(err, res);
		};
	}
	var req1 = snip.httpRequestJSON(url, {}, counter(function(err, res){
		if (count != 1){
			cb(true);
			cb = function(){};
		}
	}));
	var req2 = snip.httpRequestJSON(url, {}, counter(function(err, res){
		setTimeout(function(){
			var success = count == 2;
			cb(!success);
		}, 3000);
	}));
});

testRunner.addTest("youtube.com worker requests calls back exactly once, after limiter is set", function(p, ee, cb){
	var count = 0;
	function counter(err, res){
		++count;
	}
	var worker = new snip.Worker({expiry:4000});
	var url = "https://gdata.youtube.com/feeds/api/videos/7vlElmIWmNo?v=2&alt=jsonc";
	snip.httpRequestJSON(url, {}, worker.newJob("fetchMetadataForEid:7vlElmIWmNo").wrapCallback(counter));
	setTimeout(function(){
		var success = count == 1;
		cb(!success);
	}, 5000);
});

testRunner.run("all", null, function(err, log){
	//console.log("res: ", !err);
});
