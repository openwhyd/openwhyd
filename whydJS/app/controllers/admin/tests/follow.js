var querystring = require("querystring");
var snip = require("../../../snip.js");
var config = require("../../../models/config.js"); // {urlPrefix:"http://localhost:8000"};
var followModel = require("../../../models/follow.js");

function log(){
	console.log.apply(console, arguments);
}

exports.makeTests = function(p){

	var testVars = {};

	return [
		["fetchUserSubscriptions", function fetchSubscriptions(cb) {
			console.time("fetchUserSubscriptions");
			followModel.fetchUserSubscriptions(p.loggedUser.id, function(subscriptions) {
				testVars.uidList = [p.loggedUser.id];
				for (var i in subscriptions.subscriptions)
					if (subscriptions.subscriptions[i].id)
						testVars.uidList.push((""+subscriptions.subscriptions[i].id).replace("/u/", ""));
				console.timeEnd("fetchUserSubscriptions");
				cb(true);
			});
		}],
		["fetchSubscriptionArray == fetchUserSubscriptions", function fetchSubscriptions(cb) {
			console.time("fetchSubscriptionArray");
			followModel.fetchSubscriptionArray(p.loggedUser.id, function(subscriptions) {
				subscriptions.push(p.loggedUser.id);
				console.timeEnd("fetchSubscriptionArray");
				cb(subscriptions.sort().join() === testVars.uidList.sort().join());
			});
		}],
	];
}