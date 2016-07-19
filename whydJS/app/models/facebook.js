/**
 * facebook model
 * method to make requests to FB's Graph API
 * @author adrienjoly, whyd
 */

var https = require('https');
var mongodb = require('./mongodb.js');
var userModel = require('./user.js');
var followModel = require("./follow.js");
var querystring = require('querystring');

var host = "graph.facebook.com";

var MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // refresh fbfriends cache every week (in ms)

var CACHED_FIELDS = {
	"fbId": true,
	"name": true
};

var CACHED_LISTS = {
//	"whydFriends": true,
	"notOnWhyd": true
};

function getCol() {
	return mongodb.collections["fbfriends"];
}

function cacheFbFriends (uId, fbFriendsWithSub) {
	var toStore = { t: new Date() };
	for (var list in CACHED_LISTS) {
		toStore[list] = [];
		for (var friend in fbFriendsWithSub[list]) {
			var friendObj = {};
			for (var field in CACHED_FIELDS)
				friendObj[field] = fbFriendsWithSub[list][friend][field];
			toStore[list].push(friendObj);
		}
	}
	//console.log("toStore", toStore);
	getCol().update({_id:mongodb.ObjectId(""+uId)}, {$set:toStore}, {upsert: true}, function (err, result) {
		if (err)
			console.log("facebook.cacheFbFriends ERROR:", err);
		else
			console.log("facebook.cacheFbFriends OK", uId);
	});
}

function fetchCachedFriends(uId, options, cb) {
	//var options = options || {};
	getCol().findOne({_id:mongodb.ObjectId(""+uId)}, function (err, friends) {
		cb(friends);
	});
}

exports.fetchAccessToken = function (uId, cb) {
	userModel.fetchByUid(uId, function(user) {
		cb((user || {}).fbTok);
	});
}

exports.graphApiRequest = function (fbAccessToken, path, params, handler) {
	console.log("facebookModel.graphApiRequest", path, "...");
	params = params || {};
	//var url = path + "?method=GET&metadata=" + !!params.metadata + "&format=json&access_token=" + fbAccessToken;
	params.format = params.format || "json";
	params.access_token = fbAccessToken;
	params.metadata = !!params.metadata;
	params.method = params.method || "GET";
	var url = "/v2.3" + path + "?" + querystring.stringify(params);
	https.request({path:url,host:host,port:443,method:params.method}, function (res) {
		res.addListener('error', function(err) {
			console.log ("facebook request error: ", err);
			if (handler)
				handler({error:err});
		})
		var json = "";
		res.addListener('data', function(chunk) {
			json += chunk.toString();
		});
		res.addListener('end', function() {
			//console.log("facebookModel.graphApiRequest =>", json);
			try {
				json = JSON.parse(json);
				if (json && json.error)
					console.log("facebookModel.graphApiRequest => ERROR:", json.error);
				//var results = (json || {}).data || [];
				handler(json);
			}
			catch (e) {
				handler();
			}
		});
	}).on('error', function(err){
		console.log("[ERR] facebook.graphApiRequest ", err);
		console.error("[ERR] facebook.graphApiRequest ", err);
		handler({error: err});
	}).end();
};

exports.fetchMe = function(fbAccessToken, handler) {
	exports.graphApiRequest(fbAccessToken, "/me", {}, function(json) {
		//console.log("facebookModel.fetchMe => json: ", Object.keys(json || {}));
		var fbUser = (json || {}).data || json;
		//console.log("facebookModel.fetchMe => fbUser: ", fbUser);
		handler(fbUser);
	});
}

exports.fetchFriends = function (fbAccessToken, handler) {
	console.log("facebookModel.fetchFriends: querying facebook friends...");
	exports.graphApiRequest(fbAccessToken, "/me/friends", {metadata: true}, function(json) {
		json = json || {};
		console.log("facebookModel.fetchFriends: => ", json.data ? json.data.length + " friends" : json);
		handler(json/*{friends:results}*/);
	});
}

var /*exports.*/fetchFbFriendsOnWhyd = function(fbTok, cb) {
	if (!fbTok)
		return cb({});

	console.log("facebookModel.fetchFbFriendsOnWhyd ...");

	// 1) fetch list of facebook friends

	exports.fetchFriends(fbTok, function(res) {
		if (!res || res.error || !res.data) {
			var err = (res || {error: "unknown error"});
			console.log("fbfriends.error: ", err.error);
			return cb(err);
		}

		console.log("facebookModel.fetchFbFriendsOnWhyd => nb: ", res.data.length);

		var fbIdList = [], fbIdSet = {};
		for (var i in res.data) {
			fbIdList.push(res.data[i].id);
			fbIdSet[res.data[i].id] = res.data[i];
		}

		// 2) find which facebook friends are already on whyd

		userModel.fetchMulti({fbId:{$in:fbIdList}}, null, function(whydFriends) {

			console.log("facebookModel.fetchFbFriendsOnWhyd => nb whydfriends:", (whydFriends || []).length);

			for (var i in whydFriends) {
				whydFriends[i] = {
					id: ""+whydFriends[i]._id,
					fbId: whydFriends[i].fbId,
					name: whydFriends[i].name,
					handle: whydFriends[i].handle,
					bio: whydFriends[i].bio/*,
					subscribed: followedIdSet[""+whydFriends[i]._id]*/
				};
				delete (fbIdSet[whydFriends[i].fbId]);
			}
			var notOnWhyd = [];
			for (var i in fbIdSet)
				notOnWhyd.push({
					fbId: i,
					url: "javascript:{}",
					name: fbIdSet[i].name,
					img: "//graph.facebook.com/v2.3/"+i+"/picture" //?type=large";
				});

			console.log("facebookModel.fetchFbFriendsOnWhyd => nb notOnWhyd:", (notOnWhyd || []).length);

			cb({
				whydFriends: whydFriends,
				notOnWhyd: notOnWhyd
			});
		});
	});
}

function appendSubscribedAttribute(uId, res, cb) {
	followModel.fetchUserSubscriptions(uId, function(userSub) {
		res.userSubscriptions = userSub;
		var followedIdSet = {};
		for (var i in userSub.subscriptions)
			followedIdSet[userSub.subscriptions[i].id] = true;
		if (res && res.whydFriends && followedIdSet)
			for (var i in res.whydFriends)
				res.whydFriends[i].subscribed = !!followedIdSet[res.whydFriends[i].id];
		//console.log("facebookModel.appendSubscribedAttribute => ", res);
		cb(res);
	});
}

exports.fetchFbFriendsWithSub = function (loggedUser, fbTok, cb) {
	if (!loggedUser)
		return cb();

	console.log("facebookModel.fetchFbFriendsWithSub, uid:", loggedUser.id, "...");

	fetchFbFriendsOnWhyd(fbTok, function(res) {
		//console.log("facebookModel.fetchFbFriendsWithSub => ", res);
		if (res) {
			cacheFbFriends(loggedUser.id, res);
			appendSubscribedAttribute(loggedUser.id, res, cb);
		}
		else
			cb(res);
	});
}

exports.fetchCachedFriends = function (uId, fbTok, cb) {
	fetchCachedFriends(uId, null, function(friends) {
		cb(friends);
		var timestamp = (friends || {}).t;
		if (fbTok && timestamp) {
			console.log("fbfriends cache timestamp:", timestamp);
			var age = Date.now() - timestamp.getTime();
			console.log("fbfriends cache age:", age, age > MAX_CACHE_AGE);
			if (age > MAX_CACHE_AGE)
				fetchFbFriendsOnWhyd(fbTok, function(res) {
					if (res)
						cacheFbFriends(uId, res);
				});
		}
	});
}
