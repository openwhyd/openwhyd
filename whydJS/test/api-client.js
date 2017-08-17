var assert = require('assert');
var request = require('request');
var genuine = require('../app/genuine.js'); // for signup

var { URL_PREFIX } = require('./fixtures.js');

// AUTH

function extractCookieJar(response) {
	const jar = request.jar();
	if (((response.headers || {})['set-cookie'] || []).length) {
		jar.setCookie(request.cookie(response.headers['set-cookie'][0]), URL_PREFIX);
	}
	return jar;
}

exports.logout = function logout(jar, callback) {
	exports.get(jar, `/login?action=logout&ajax=1`, function(error, res) {
		assert.ifError(error);
		assert.equal(res.response.statusCode, 200);
		callback(error, Object.assign({}, res, { jar: extractCookieJar(res.response) }));
	});	
}

exports.loginAs = function loginAs(user, callback) {
	const url = `/login?action=login&ajax=1&email=${user.email}&md5=${user.md5}`;
	exports.get(null, url, function(error, res) {
		assert.ifError(error);
		assert.equal(res.response.statusCode, 200);
		callback(error, Object.assign({}, res, { jar: extractCookieJar(res.response) }));
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
// HTTP request wrappers

exports.get = function(jar, url, callback) {
	request.get({ jar, url: `${URL_PREFIX}${url}` }, function(error, response, body) {
		var json = undefined;
		try {
			json = JSON.parse(body);
		} catch (e) {}
		callback(error, { response, body, json, jar });
	});	
};

// USER

/*
exports.getMe = function(jar, callback) {
	request.get({ jar, url: `${URL_PREFIX}/me?format=json` }, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar });
		// => body: {"errorCode":"USER_NOT_FOUND","error":"User not found..."} ???
	});	
}
*/

exports.getUser = function(jar, body, callback) {
	// TODO: pass body parameters
	exports.get(jar, `/api/user`, function(error, res) {
		assert.ifError(error);
		assert.equal(res.response.statusCode, 200);
		callback(error, res);
	});	
}

exports.setUser = function(jar, body, callback) {
	// TODO: pass body parameters
	request.post({
		jar,
		url: `${URL_PREFIX}/api/user`,
		json: true,
		body
	}, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar });
	});	
}

// /api/post

exports.addPost = function(jar, body, callback) {
	request.post({
		jar,
		url: `${URL_PREFIX}/api/post`,
		json: true,
		body: Object.assign({ action: 'insert' }, body),
	}, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar });
	});	
};

exports.addComment = function(jar, body, callback) {
	request.post({
		jar,
		url: `${URL_PREFIX}/api/post`,
		json: true,
		body: Object.assign({ action: 'addComment' }, body),
	}, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		callback(error, { response, body, jar });
	});	
};

exports.getPlaylist = function(jar, plId, callback) {
	exports.get(jar, `/api/playlist?id=${plId}`, callback);
};

exports.getPlaylistTracks = function(jar, uId, plId, callback) {
	// TODO: define a version that accepts parameters (limit, after, before...)
	exports.get(jar, `/${uId}/playlist/${plId}?format=json`, callback);
};
