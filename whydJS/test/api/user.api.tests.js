var assert = require('assert');
var request = require('request');

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
var api = require('../api-client.js');

// TODO: POST /onboarding endpoints

describe(`user api -- setting user data`, function() {

	it(`updates the user's name`, function (done) {
		api.loginAs(TEST_USER, function(error, { response, body, jar }) {
			assert.ifError(JSON.parse(body).error);
			assert(JSON.parse(body).redirect);
			api.getUser(jar, {}, function(error, { response, body }) {
				assert.equal(JSON.parse(body).name, TEST_USER.name);
				const newName = 'renamed user';
				api.setUser(jar, { name: newName }, function(error, { response, body }) {
					assert.equal(body.name, newName);
					done();
				});
			});
		});
	});
});
