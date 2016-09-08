/**
 * sendgrid email implementation (used by email.js generic wrapper)
 * send emails through sendgrid api
 * @author adrienjoly, whyd
 **/

var https = require('https');
//var email = require("emailjs/email");

var querystring = require('querystring');

/*
var credentials = {
	user: "19aeb83d63953065a4939ce47fd6341d",
	password: "d7d0d040efe01bb32ffcf10dd22d427c",
	host: "in.mailjet.com",
	tls: true,
	domain: "mailjet.com"
};
console.log ("Email notifier connecting to SMTP server: ", credentials.host);

var server = email.server.connect(credentials);
*/

exports.email = function(emailAddr, subject, textContent, htmlContent, userName, callback) {
	console.log("email", emailAddr, subject);
	/*
	var message = email.message.create({
		text: textContent, 
		from: "openwhyd <contact@openwhyd.org>",
		to: emailAddr,
		subject: subject
	});
	
	if (htmlContent) message.attach_alternative(htmlContent);
	
	server.send(message, function(err, message) {console.log("email callback: ", err || message);});
	*/

	if (!emailAddr)
		return callback && callback({error: "no email address was provided"});
   
   // Set up message
	var content = {
		api_user: process.env.SENDGRID_API_USER.substr(), // "contact@openwhyd.org",
		api_key: process.env.SENDGRID_API_KEY.substr(),
		from: process.env.SENDGRID_API_FROM_EMAIL.substr(), // "no-reply@whyd.org",
		fromname: process.env.SENDGRID_API_FROM_NAME.substr(), // "whyd",
		to: emailAddr,
		subject: subject,
		text: textContent
	};
	
	if (userName) content.toname = userName;
	if (htmlContent) content.html = htmlContent;
	
	content = querystring.stringify(content);

	// Initiate REST request
	var request = https.request({
		method: "POST",
		host: "sendgrid.com",
		port: 443,
		path: "/api/mail.send.json",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-length': content.length
		}
	}, function(response) {
		var data = "";
		response.on('data', function(chunk) {
			data += chunk;
		});
		response.on('end', function() {
			console.log("email response: ", data);
			if (callback) callback(data);
		});
	}).on('error', function(err){
		console.log("[ERR] emailSendgrid.email ", err);
		console.error("[ERR] emailSendgrid.email ", err);
		if (callback) callback({error: err});
	});

	// Send request
	request.write(content);
	request.end();
};
