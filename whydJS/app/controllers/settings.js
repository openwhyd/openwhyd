/**
 * settings controller
 * @author adrienjoly, whyd
 */

var userModel = require("../models/user.js");
var analytics = require("../models/analytics.js");
var templateLoader = require("../templates/templateLoader.js");
var mainTemplate = require("../templates/mainTemplate.js");

var TEMPLATE_FILE = "app/templates/settings.html";
var pageTemplate = null;

exports.refreshTemplates = function(callback) {
	pageTemplate = templateLoader.loadTemplate(TEMPLATE_FILE, callback);	
};

exports.refreshTemplates();

exports.renderSettingsForm = function(p, cb) {
	//userModel.fetchByUid(p.loggedUser._id, function(loggedUser){
		/*exports.refreshTemplates(function(){*/
			p.user = p.loggedUser;
			p.content = pageTemplate.render(p);
			p.bodyClass = "pgSettings";
			cb({html: mainTemplate.renderWhydPage(p)});
		/*});*/
	//});
};

exports.controller = function(request, reqParams, response, error) {
	request.logToConsole("settings.controller", request.method);
	reqParams = reqParams || {};
	reqParams.loggedUser = request.checkLogin(response);
	if (!reqParams.loggedUser) return;

	exports.renderSettingsForm(reqParams, function(res) {
		response.render(res.html, null, {'content-type': 'text/html'});
	});
	analytics.addVisit(reqParams.loggedUser, request.url/*"/u/"+uid*/);
}

// from newsletter unsubscribe
/*
	if (reqParams.confirm) {
		users.update(loggedInUser.id, {$set:{digest:false}}, function(user) {
			response.render("You are now unsubscribed from your personalized Topic Summary. Thanks for your feedback!");
			var text = reqParams.feedback;
			if (text && text != defaultFeedback)
				feedback.add(loggedInUser.id, "digest", text);
		});
	}
*/

