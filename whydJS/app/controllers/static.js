/**
 * static controller
 * redirects to static files
 * @author adrienjoly, whyd
 */
/**
 * subdir controller
 * maps to another controller, based on the path
 * @author adrienjoly, whyd
 */

var config = require("../models/config.js");
var runsLocally = config.urlPrefix.indexOf("localhost") != -1;

var SUPPORT_PAGE = "https://github.com/openwhyd/openwhyd/blob/master/docs/FAQ.md#how-to-contact-openwhyds-team";
var DONATE_PAGE = "https://opencollective.com/openwhyd";
var PRIVACY_PAGE = config.urlPrefix + "/privacy";

var STATIC_FILES = {
	"/favicon.ico": "/images/favicon"+(runsLocally ? "_orange" : "")+".ico",
	"/favicon.png": "/images/favicon"+(runsLocally ? "_orange" : "")+".png",
	"/faq": "https://github.com/openwhyd/openwhyd/blob/master/docs/FAQ.md",
	"/help": SUPPORT_PAGE,
	"/team": SUPPORT_PAGE,
	"/support": SUPPORT_PAGE,
	"/contact": SUPPORT_PAGE,
	"/community": "https://github.com/openwhyd/openwhyd",
	"/sponsor": DONATE_PAGE,
	"/donate": DONATE_PAGE,
	"/tos": PRIVACY_PAGE,
};

exports.controller = function(request, reqParams, response) {
	var path = request.url.split("?")[0];

	for (var i in STATIC_FILES)
		if (i == path)
			return response.temporaryRedirect(STATIC_FILES[i]);

	response.temporaryRedirect(path + "/"); // /index.html
};