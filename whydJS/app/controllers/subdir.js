/**
 * subdir controller
 * maps to another controller, based on the path
 * @author adrienjoly, whyd
 */

var config = require("../models/config.js");

exports.controller = function(request, reqParams, response) {
	//request.logToConsole("[subdir]", reqParams);

	var path = request.url.split("?")[0];
	//console.log("branching to " + path);
	var splitted = path.split("/");
	var subDir = splitted[1];
	var ctrName = splitted[2];
	//console.log("=> branching to /" + subDir + "/" + ctrName);

	if (this.controllers[subDir] && typeof this.controllers[subDir][ctrName] === 'function')
		this.controllers[subDir][ctrName](request, reqParams, response);
	else {
		console.error("[subdir] no controller found at " + request.url);
		response.notFound();
	}
};