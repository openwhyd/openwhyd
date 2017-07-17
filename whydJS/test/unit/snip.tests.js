/**
 * snippet tester
 * @author adrienjoly, whyd
 **/

var assert = require('assert');

describe('snip.httpRequest', function() {

	var snip = require("../../app/snip.js");
	//var testRunner = new require("../app/serverTestRunner.js").ServerTestRunner();

	var YOUTUBE_API_KEY = "AIzaSyADm2ekf-_KONB3cSGm1fnuPSXx3br4fvI";
	var YOUTUBE_VIDEO_ID = "aZT8VlTV1YY";

	var url = "https://www.googleapis.com/youtube/v3/videos?id=" + YOUTUBE_VIDEO_ID + "&part=snippet&key=" + YOUTUBE_API_KEY;

	function handler(err, res){
		//console.log("log", "http response:", res.error || res);
	}

	it('should return a non-null value for google.com', function() {
		assert(snip.httpRequest("https://google.com/", {}, handler));
	});

	it('should run simultaneous requests to google.com', function() {
		var url = "https://google.com/";
		var req1 = snip.httpRequest(url, {}, handler);
		var req2 = snip.httpRequest(url, {}, handler);
		assert(req1 && req2)
	});

	it('should run simultaneous requests to googleapis.com, until limiter is set', function() {
		var req1 = snip.httpRequestJSON(url, {}, handler);
		var req2 = snip.httpRequestJSON(url, {}, handler);
		var success = req1 && req2;
		snip.httpSetDomain(/youtube\.com/, { queue: [] });
		assert(success);
		// AJ note: what's the meaning of this test? I forgot...
	});
	/*
	testRunner.addTest("youtube.com requests are run sequentially, after limiter is set", function(p, ee, cb){
		var req1 = snip.httpRequestJSON(url, {}, handler);
		var req2 = snip.httpRequestJSON(url, {}, function(err, res){
			var success = req1 && !req2 && res.data.id == "7vlElmIWmNo";
			cb(!success);
		});
	});

	testRunner.addTest("youtube.com requests call back exactly once per call, after limiter is set", function(p, ee, cb){
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
		snip.httpRequestJSON(url, {}, worker.newJob("fetchMetadataForEid:" + YOUTUBE_VIDEO_ID).wrapCallback(counter));
		setTimeout(function(){
			var success = count == 1;
			cb(!success);
		}, 5000);
	});
	*/
});
