/**
 * contentType controller
 * Extracts the content-type of a http resource
 */
var URL = require('url');
var http = require('http');
var https = require('https');
var get = require('get');

//var generalUrl = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	
/*
var getContentType = function(url, handler)
{
	//if (url.startsWith("http://img.freebase.com"))
	//	return handler("image/jpeg");
	
	var parsedUrl = URL.parse(url);
	var isHttps = url.startsWith("https");

	var req = {
		method:"HEAD",
		host: (parsedUrl.hostname || "localhost"),
		port: parsedUrl.port || (isHttps ? 443 : 80),
		path: parsedUrl.pathname + (parsedUrl.search || '')
	};
	
	console.log("request", req);

	req = (isHttps ? https : http).request(req, function (res) {
		var contentType = res.statusCode == 200 ? res.headers["content-type"] : null;
		
		var result = {
			statusCode: res.statusCode,
			contentType: contentType
		};
		console.log("contentType result:", result);
		handler(result);
	});
	
	req.addListener('error', function(err) {
		console.log ("contentType error:", err);
		//handler("null");
	});
	
	req.end();
}
*/
exports.controller = function(request, reqParams, response)
{
	request.logToConsole("contentType.controller", reqParams);
	
	if (!reqParams) {
		console.log("contentType: no url provided => returning null");
		response.render(null);
		return;
	}
	
	function handleError(err) {
		console.log("contentType error:", err);
		response.render({error: err});
	}
	
	function renderResult(contentType, title, images) {
		var result = {
			statusCode: 200,
			contentType: contentType,
			title: title,
			images: images
		};
		console.log("contentType result:", result);
		response.render(result);
	}
	
	var url = reqParams.url;
	
	if (url.indexOf("openwhyd.org") > -1 || url.indexOf("localhost:") > -1) {
		if (url.contains("/upload_data/") || url.contains("/uPostedImg/") || url.contains("/uAvatarImg/") || url.contains("/ugTopicImg/"))
			return renderResult("image/unknown");
	}
	
	try {
		get.ContentType(url, function(err, contentType) {
			if (contentType === 'text/html')
				get(url, function(err, page) {
					if (page && !err)
						renderResult(contentType, page.getTitle(), page.getImages());
					else
						handleError(err);
				});
			else if (contentType && contentType != "noContentType")
				renderResult(contentType);
			else
				handleError(err);
		});
	} catch (err) {
		handleError(err);
	}
}