/**
 * onboarding controller
 * handles the onboarding process (for new users)
 * @author adrienjoly, whyd
 */

// testing phase 3: send welcome email
// $ curl -v --data "ajax=follow" --cookie "whydSid=4j8OSWWYknxyPlmGmgqURg12AiBoKDQpqt4iU610PT9nKkIkRdlMgHWF9kFMsQEvU" http://whyd.com/onboarding

var snip = require("../snip.js");
var config = require("../models/config.js");
var mongodb = require("../models/mongodb.js");
var userModel = require("../models/user.js");
var plTagsModel = require("../models/plTags.js");
var facebookModel = require("../models/facebook.js");
var followModel = require("../models/follow.js");
var analytics = require("../models/analytics.js");
var notifModel = require("../models/notif.js");
var notifEmails = require("../models/notifEmails.js");

var TEMPLATE_FILE = "app/templates/onboarding.html";
var mainTemplate = require("../templates/mainTemplate.js");
var templateLoader = require("../templates/templateLoader.js");
var template = templateLoader.loadTemplate(TEMPLATE_FILE);

var MAX_RECOM_USERS = 10;

var templates = {
	//"people": "app/templates/onboarding/pickPeople.html",
	"bookmarklet-legacy": "app/templates/onboarding/bookmarklet.html" // old version (still bound to whyd.com/bookmarklet and whyd.com/button)
};

function makeTemplateRenderer(cb) {
	return function (p){
		templateLoader.loadTemplate(templates[p.step] || TEMPLATE_FILE, function (template){
			p.content = template.render(p);
			cb(p);
		});
	}
}
/*
function sortUsersByRelevance(users, tags) {
	var tagSet = snip.arrayToSet(tags);
	var users = users.slice();
	for(var i in users) {
		//console.log("sorting", i, users[i].tags)
		users[i].score = 0;
		var userTags = users[i].tags;
		for(var j in userTags)
			if (tagSet[userTags[j].id])
				users[i].score += userTags[j].c;
	}
	return users.sort(function(a,b){
		return b.score - a.score;
	});
}
*/
function fetchUserData(recomUsers, pickedTags, cb) {
	var pickedTagSet = snip.arrayToSet(pickedTags || []);
	plTagsModel.getTagEngine(function(tagEngine){
		userModel.fetchUserBios(recomUsers, /*cb*/ function(){
			var i = recomUsers.length;
			(function next() {
				if (--i < 0)
					cb(recomUsers);
				else
					tagEngine.fetchTagsByUid(recomUsers[i].id, function(tags) {
						/*
						var total = tags.map(function(tag){
							return tag.c;
						}).reduce(function(a, b){
							return a + b;
						});
						(recomUsers[i].tags = tags.slice(0,3)).map(function(tag){
							tag.c = Math.floor(100 * tag.c / total) + " %";
						});
						*/
						/*
						recomUsers[i].tags = [];
						tags.map(function(tag){
							if (pickedTagSet[tag.id])
								recomUsers[i].tags.push(tag);
						});
						*/
						recomUsers[i].tags = tags.slice(0,3);
						next();
					});
			})();
		});
	});
}

function fetchUsersByTags(tags, cb) {
	plTagsModel.getTagEngine(function(tagEngine){
		cb(tagEngine.getUsersByTags(tags).slice(0, MAX_RECOM_USERS));
	});
}

var processAjax = {
	"fbFriends": function(p, cb) {
		facebookModel.fetchAccessToken(p.loggedUser.id, function(fbTok) {
			facebookModel.fetchFbFriendsWithSub(p.loggedUser, p.fbTok || fbTok, function(res) {
				var fbFriends = (res||{}).whydFriends || [];
				//console.log("fbfriends", fbFriends);
				if (fbFriends.length) {
					// TODO: ranking and stuff...
					//fbFriends = sortUsersByRelevance(fbFriends, (p.genres || "").split(","));
					fetchUserData(fbFriends, (p.genres || "").split(","), cb);
				}
				else
					cb(fbFriends);
			});
		});
	},
	"people": function(p, cb) {
		var tags = (p.genres || "").split(",");
		console.log("fetchpeople...", tags);
		fetchUsersByTags(tags, function(recomUsers){
			fetchUserData(recomUsers, tags, cb);
		});
	},
	"follow": function(p, cb) {

		userModel.fetchByUid(p.loggedUser.id, function(user){
			console.log("onboarding, sending welcome email", user.email, user.iBy);
			var inviteSender = user.iBy ? mongodb.getUserFromId(user.iBy) : null;
			notifEmails.sendRegWelcomeAsync(user, inviteSender);
		});


		console.log("onboarding, following uids:", p.uids);
		var uids = (p.uids || "").split(",");
		(function next(){
			var uid = uids.pop();
			if (uid)
				followModel.add({
					uId: p.loggedUser.id, uNm: p.loggedUser.name,
					tId: uid, tNm: mongodb.getUserNameFromId(uid),
					ctx: "onb" // onb = onboarding context
				}, function() {
					console.log("onboarding, followed uid", uid);
					notifModel.subscribedToUser(p.loggedUser.id, uid, next);
				});
		})();
		cb({ok:true});
	}
};

var processStep = {
	"genres": function(p, render) {
		(p.css = p.css || []).push("onboarding.css");
		p.bodyClass = "pgOnboarding stepGenres minimalHeader";
		p.stepGenres = true;
		render(p);
	},
	"people": function(p, render) {
		(p.css = p.css || []).push("onboarding.css");
		p.bodyClass = "pgOnboarding stepPeople minimalHeader";
		p.stepPeople = true;
		render(p);
		userModel.update(p.loggedUser.id, {$set:{"onb.tags":p.genres.split(",")}});
	},
	"button": function(p, render) {
		(p.css = p.css || []).push("onboarding.css");
		p.bodyClass = "pgOnboarding stepButton minimalHeader";
		p.stepButton = true;
		render(p);
	},
	"bookmarklet-legacy": function(p, render) {
		render(p);
	}
};

function handleRequest (p, cb) {
	if (p.ajax && processAjax[p.ajax]) {
		processAjax[p.ajax](p, cb);
	}
	else {
		var lastUrlWord = p.pageUrl.split("?")[0].split("/")[1];
		if (lastUrlWord == "bookmarklet" || lastUrlWord == "button")
			p.step = "bookmarklet-legacy";	
		
		var processor = processStep[p.step];
		if (!processor)
			cb({error:"unknown step"}); //cb({redirect:"/"});
		else {
			processor(p, makeTemplateRenderer(cb));
			analytics.addVisit(p.loggedUser, p.pageUrl);
		}
	}
};

exports.controller = function(request, getParams, response) {
	var p = (request.method.toLowerCase() === 'post' ? request.body : getParams) || {};
	request.logToConsole("onboarding.controller " + request.method, p);
	// make sure user is logged in
	if (!(p.loggedUser = request.checkLogin(response))) return;
	p.pageUrl = request.url;
	p.genres = plTagsModel.extractGenreTags(p.genres || "").join(","); // sanitize genres
	console.log("sanitized genres", p.genres);
	handleRequest(p, function(r) {
		if (!r || r.error) {
			r = r || {};
			console.log(r.error);
			//response.temporaryRedirect("/welcome");
		}
		else if (r.content)
			r.html = mainTemplate.renderWhydPage(r);

		if (r.redirect)
			response.temporaryRedirect(r.redirect);
		else if (r.html)
			response.renderHTML(r.html);
		else
			response.renderJSON(r);
	});
}
