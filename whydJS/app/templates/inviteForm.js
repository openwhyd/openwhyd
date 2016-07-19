/**
 * page template to invite people from facebook / email
 * @author adrienjoly, whyd
 **/

var snip = require("../snip.js");
var mainTemplate = require("../templates/mainTemplate.js");
var notifTemplate = require("../templates/notif.js");
var templateLoader = require("../templates/templateLoader.js");
var template = null;

exports.refreshTemplates = function(callback) {
	template = templateLoader.loadTemplate("app/templates/inviteForm.html", callback);	
};

exports.refreshTemplates();

var MSG_HTML = "<span>[[ your personal message here ]]</span>";
var MSG_TOKEN = "[[MSG]]";

exports.renderInviteForm = function (params) {
	var params = params || {}
	params.fields = [{n:1},{n:2}]; //var NB_INVITES = 3;
	params.pageTitle = "Invite your friends!";
	params.inviteCode = "XXXXXXXXXXXXXX";
	params.emailTemplate = notifTemplate.generateInviteBy(params.loggedUser.name, params.inviteCode, MSG_TOKEN);
	params.emailSubject = params.emailTemplate ? params.emailTemplate.subject : "(none)";
	params.emailTemplate = (params.emailTemplate || {}).bodyText || "";
	params.emailTemplate = snip.htmlEntities(params.emailTemplate).replace(/\n\n/g, "<p>").replace(MSG_TOKEN, MSG_HTML);
	return template.render(params);
};

exports.renderInviteFormPage = function (params) {
	params.content = exports.renderInviteForm(params);
	return mainTemplate.renderWhydPage(params);
};