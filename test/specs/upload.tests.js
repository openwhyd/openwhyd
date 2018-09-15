var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js');
const webUI = require('../web-ui.js');

const request = require('request');

const WAIT_DURATION = 10000;

var defaultAvatarLen;
request(`${URL_PREFIX}/images/blank_user.gif`, function(error, response, body) {
  defaultAvatarLen = body.length;
});

require('../acceptance-cmds.js'); // also checks that openwhyd's server is tested against the test database
// TODO: make sure that DB was reset before starting Openwhyd's app server

// ... AND that the user cache was reset as well. (e.g. by restarting Openwhyd's server)

describe('upload user profile images', function() {
  it(`user login`, webUI.loginAs(ADMIN_USER));

  it(`go to user profile`, function() {
    browser.url(`${URL_PREFIX}/u/${ADMIN_USER.id}`);
  });

  it(`click on "Edit profile"`, function() {
    browser.clickOnContent('Edit profile');
  });

  it(`click on "Edit Profile Info"`, function() {
    browser.clickOnContent('Edit Profile Info');
  });

  it(`has default avatar"`, function async() {
    /*
    console.log($('.avatar-box img').getAttribute('src'));
    assert.ok(/blank_user.gif/.test($('.avatar-box img').getAttribute('src')));
    */
    /*
    request(`${URL_PREFIX}/img/u/${ADMIN_USER.id}`, function (error, response, body) {
      assert.equal(defaultAvatarLen, response.headers['content-length']);
    });
    */
    return new Promise(function(resolve, reject) {
      //assert.ok(!/blank_user.gif/.test($('.avatar-box img').getAttribute('src')));
      request(
        `${URL_PREFIX}/img/u/${ADMIN_USER.id}?_t=${new Date().getTime()}`,
        function(error, response, body) {
          assert.equal(defaultAvatarLen, body.length);
          resolve();
        }
      );
    });
  });

  // TODO: make the following tests work:
  /*
  it(`upload sample avatar`, function() {
    browser.pause(200);
    var path = __dirname + 'test/specs/upload-resources/sample-avatar.jpg';
    // 0. display form and file input (for browser security reasons)
    browser.execute(function() {
      $('#avatarForm').show();
    });
    browser.pause(200);
    // 1. add file input
    $('input[type="file"]').addValue(path);
    browser.pause(200);
    //browser.keys(path);
    $('input[type="file"]').keys(path);
    $('#avatarForm').submitForm();
    browser.pause(200);
    // 2. simulate drag and drop
    / *
    browser.execute(function(path) {
      var files = [ path ];
      var eve = document.createEvent("HTMLEvents");
      eve.initEvent("drop", true, true);
      eve.type = "drop";
      eve.dataTransfer = {
        preventDefault: function() {},
        files: files,
        item: function(i) { return files[i]; },
      };
      document.getElementById("avatarDrop").dispatchEvent(eve);
      $('#avatarDrop')[0].ondrop({ preventDefault: function(){}, dataTransfer: { files: files } });
    }, path);
    * /
    // test in browser:
    // var path = '/Users/adrienjoly/dev/openwhyd/openwhyd/test/specs/upload-resources/sample-avatar.jpg';
    // $('input[type="file"]').val(path); // does not work, for security reasons
    // $('#avatarDrop')[0].ondrop({ preventDefault: function(){}, dataTransfer: { files: [ path ] } });
  });

  it(`save profile changes`, function() {
    browser.pause(5000)
    browser.clickOnContent('Save');
  });

  it(`has new avatar"`, function async() {
    return new Promise(function (resolve, reject) {
      browser.pause(1000).then(function() {
        //assert.ok(!/blank_user.gif/.test($('.avatar-box img').getAttribute('src')));
        request(`${URL_PREFIX}/img/u/${ADMIN_USER.id}?_t=${new Date().getTime()}`, function (error, response, body) {
          console.log('defaultAvatarLen', defaultAvatarLen);
          console.log('current avatar length', body.length);
          assert.notEqual(defaultAvatarLen, body.length);
          resolve();
        });
      });
    });
  });

  it(`should output browser log`, function () {
    console.log('browser log:', browser.log('browser').value.slice(-10));
  });
  */
  //webUI.logout();
});

// Webdriver API documentation: http://webdriver.io/api.html
