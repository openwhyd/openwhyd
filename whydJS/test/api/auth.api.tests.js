var assert = require('assert');
var request = require('request');

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js')

describe('auth api', function() {

	it('login with email', function (done) {
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
});
