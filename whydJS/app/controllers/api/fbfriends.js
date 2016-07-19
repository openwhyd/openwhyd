/**
 * fbfriends controller
 * extract the user's list of facebook friends, and detect which ones are registered on whyd
 * @author adrienjoly, whyd
 */

var https = require('https');
var facebookModel = require("../../models/facebook.js");

exports.handleRequest = function(request, reqParams, response) {
	request.logToConsole("fbfriends.handleRequest", reqParams);
	reqParams = reqParams || {};
	//if (!reqParams || !reqParams.fbAccessToken /*|| !reqParams.fbUserId*/)
	//	return response.response({error:"invalid request"});

	var loggedUser = request.checkLogin();
	if (!loggedUser) return response.render({error: "must be logged in"});

	facebookModel.fetchAccessToken(loggedUser.id, function(fbTok) {
		console.log("fbTok in db + param", fbTok, reqParams.fbAccessToken);

		if (reqParams.fetchUsersToInvite) {
			//var nbFriends = parseInt(""+reqParams.fetchUsersToInvite);
			facebookModel.fetchCachedFriends(loggedUser.id, fbTok, function(fbfriends){
				var list = (fbfriends || {}).notOnWhyd || [];
				/*
				//console.log("fbfriends", fbfriends);
				if (list.length > nbFriends) {
					// pick two random friends from list
					var i1 = Math.floor(Math.random() * list.length), v2 = null;
					do {
						i2 = Math.floor(Math.random() * list.length);
					}
					while (i1 === i2);
					//list = list.slice(0, nbFriends);
					list = [list[i1], list[i2]];
				}
				*/
				for (var i in list) {
					list[i].img = "//graph.facebook.com/v2.3/"+list[i].fbId+"/picture";
					list[i].url = "javascript:return false;";//"http://graph.facebook.com/v2.3/"+list[i].fbId;
					list[i].bio = "From Facebook"
				}
				//console.log("fbfriends result", list);
				response.render({fbfriends:list});
			});

		}
		else
			facebookModel.fetchFbFriendsWithSub(loggedUser, reqParams.fbAccessToken || fbTok, function(result) {
				response.render(result);
			});
	});
}

exports.controller = function(request, getParams, response) {
	if (request.method.toLowerCase() === 'post')
		exports.handleRequest(request, request.body, response);
	else
		exports.handleRequest(request, getParams, response);
}
