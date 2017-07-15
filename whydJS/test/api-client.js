var assert = require('assert');
var request = require('request');
var genuine = require('../app/genuine.js'); // for signup

var { URL_PREFIX } = require('./fixtures.js');

function extractCookieJar(response) {
	const jar = request.jar();
	if (((response.headers || {})['set-cookie'] || []).length) {
		jar.setCookie(request.cookie(response.headers['set-cookie'][0]), URL_PREFIX);
	}
	return jar;
}

exports.logout = function logout(jar, callback) {
	request.get({ jar, url: `${URL_PREFIX}/login?action=logout&ajax=1` }, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar: extractCookieJar(response) });
	});	
}

exports.loginAs = function loginAs(user, callback) {
	const url = `${URL_PREFIX}/login?action=login&ajax=1&email=${user.email}&md5=${user.md5}`;
	request.get(url, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar: extractCookieJar(response) });
	});
}

exports.signupAs = function signupAs(user, callback) {
	request.post({
		url: `${URL_PREFIX}/register`,
		json: true,
		body: Object.assign({
			ajax: 1,
			sTk: genuine.makeSignupToken({ connection: { remoteAddress: '::ffff:127.0.0.1' } }),
		}, user),
	}, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar: extractCookieJar(response) });
	});
}
