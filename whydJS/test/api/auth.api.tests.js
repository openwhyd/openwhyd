var assert = require('assert');
var request = require('request');

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js')

describe('auth api -- login with email', function() {

	it('succeeds', function (done) {
		const url = URL_PREFIX + `/login?action=login&ajax=1&email=${ADMIN_USER.email}&md5=${ADMIN_USER.md5}`;
		request.get(url, function(error, response, body) {
			assert.ifError(error);
			assert.equal(response.statusCode, 200);
			const cookies = ((response.headers || {})['set-cookie'] || []).join(' ');
			assert(/whydSid\=/.test(cookies));
			assert(JSON.parse(body).redirect);
			done();
		});
	});

	it('gives access to personal /stream', function (done) {
		const url = URL_PREFIX + `/login?action=login&ajax=1&email=${ADMIN_USER.email}&md5=${ADMIN_USER.md5}`;
		request.get(url, function(error, response, body) {
			assert.ifError(error);
			assert.equal(response.statusCode, 200);

			const cookie = request.cookie((response.headers || {})['set-cookie'][0]);
			const jar = request.jar();
			jar.setCookie(cookie, URL_PREFIX);
			request({ jar, url: URL_PREFIX + '/stream?format=json' }, function(error, response, body) {
				assert.ifError(error);
				assert.equal(response.statusCode, 200);
				var json = JSON.parse(body);
				assert.ifError(json.error);
				assert(json.join); // check that it's an array
				done();
			});
		});
	});

	it('fails if wrong email', function (done) {
		const url = URL_PREFIX + `/login?action=login&ajax=1&email=aa@aa.com&md5=${ADMIN_USER.md5}`;
		request.get(url, function(error, response, body) {
			assert.ifError(error);
			assert(/email/.test(JSON.parse(body).error));
			done();
		});
	});

	it('fails if wrong password', function (done) {
		const url = URL_PREFIX + `/login?action=login&ajax=1&email=${ADMIN_USER.email}&md5=aaa`;
		request.get(url, function(error, response, body) {
			assert.ifError(error);
			assert(JSON.parse(body).wrongPassword);
			done();
		});
	});
});
