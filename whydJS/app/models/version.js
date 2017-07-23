// iphone versionning
// cf: https://trello.com/c/wwQO0Xi3/458-api-envoyer-le-numero-de-version-actuel-dernier-en-date-afin-de-notifier-d-une-mise-a-jour

var fs = require('fs');
var config = require("../models/config.js");

var VERSIONS_CACHE = {
	openwhydServerVersion: config.version,
	decodeVer: undefined,
	iphoneAppVer: undefined, // LATEST IPHONE APP UPDATE NUMBER
};

function countJsonFiles(files){
	var count = 0;
	for (var i in files)
		if (files[i].indexOf(".json") != -1)
			++count;
	return count;
}

exports.updateVersions = function(cb){
	fs.readdir("public/iphone/version", function(err, files){
		VERSIONS_CACHE.iphoneAppVer = countJsonFiles(files) - 1;
		fs.stat('public/html/decode.html', function(err, res){
			VERSIONS_CACHE.decodeVer = new Date((res || {}).mtime).getTime();
			console.log("current iPhone versions:", VERSIONS_CACHE);
			cb && cb(VERSIONS_CACHE);
		});
	});
};

exports.getVersions = function(){
	return VERSIONS_CACHE;
}

// populate the cache
exports.updateVersions();
