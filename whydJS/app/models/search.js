/**
 * generic search wrapper
 * @author adrienjoly, whyd
 **/

var config = require("./config.js");

if (config.searchModule)
	console.log("loading SEARCH module: " + config.searchModule + "...");
else
	console.log("models.search: DISABLED (see config.enableSearchIndex)");

var searchImpl = config.searchModule ? require("./" + config.searchModule) : {};

var FCTS_REQUIRED = {
	"init": 1,
	"query": 1,
};

var FCTS_OPTIONAL = {
	"countDocs": 1,
	"index": 1,
	"indexBulk": 1,
	"indexTyped": 2,
	"indexPlaylist": 3,
	"deleteDoc": 2,
	"deleteAllDocs": 1,
	"deletePlaylist": 2,
};

function makeNoImplHandler(methodName, cbPos){
	return function(){
		console.log("models.search: NO IMPLEMENTATION for " + methodName);
		var callback = arguments[cbPos];
		callback && callback();
	};
}

for (var methodName in FCTS_REQUIRED) {
	if (!searchImpl[methodName])
		console.error("models.search: NO IMPLEMENTATION for " + methodName);
	exports[methodName] = searchImpl[methodName] || makeNoImplHandler(methodName, FCTS_REQUIRED[methodName]);
}

for (var methodName in FCTS_OPTIONAL)
	exports[methodName] = searchImpl[methodName] || makeNoImplHandler(methodName, FCTS_OPTIONAL[methodName]);

searchImpl.init();
