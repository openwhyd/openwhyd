context('upload', () => {
  let userId;

  beforeEach('login', () => {
    cy.fixture('users.js').then(({ dummy }) => {
      cy.login(dummy);
      userId = dummy.id;
    });
  });

  it('user profile images', () => {
    // check that user has the default profile image
    let defaultImageBody;
    cy.request(`/images/blank_user.gif`).then((response) => {
      defaultImageBody = response.body;
    });
    cy.request(`/img/u/${userId}?_t=${new Date().getTime()}`).should(
      (response) => {
        expect(response.body).to.equal(defaultImageBody);
      }
    );

    // upload a new profile image
    cy.visit(`/u/${userId}`); // user's profile page
    cy.get('body').contains('Edit profile').click();
    cy.get('body').contains('Edit Profile Info').click();

    // TODO: make the following tests (from webdriver) work:
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
  });
});
