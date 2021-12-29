/* global $ */

window.globals = window;

var href = window.location.href + '/';

var fbId;
if (href.indexOf('openwhyd.org/') > 0) {
  // namespace = 'whydapp';
  fbId = '169250156435902';
} else {
  // namespace = 'whyd-dev';
  fbId = '1573219269412628';
}

var facebookPerms = 'public_profile,email';

var whenFbReadyQueue = [];

window.globals.whenFbReady = function (fct) {
  whenFbReadyQueue.push(fct);
};

const fbSafeCall = function (fct, failFct) {
  if (!window.globals.FB) {
    window.globals.showMessage(
      'Unable to connect to Facebook. Did you block it?',
      true
    );
    if (failFct) failFct();
  } else fct();
};

window.globals.fbIsLogged = function (cb) {
  if (window.globals.FB)
    window.globals.FB.getLoginStatus(function (response) {
      cb(
        response.status === 'connected' &&
          window.globals.user.fbId == response.authResponse.userID
      );
    }, true);
  else if (cb) cb(false);
};

window.globals.fbAuth = function (perms, cb, dontLink) {
  fbSafeCall(function () {
    window.globals.FB.login(
      function (response) {
        console.log('fb response', response);
        response = response || {};
        cb((response.authResponse || {}).userID, response);

        // associate (store) the fbUid and accesstoken to the user in openwhyd DB
        if (!dontLink && response.authResponse)
          $.ajax({
            type: 'POST',
            url: '/facebookLogin',
            data: {
              action: 'link',
              fbUid: response.authResponse.userID,
              fbAccessToken: response.authResponse.accessToken,
            },
          });
      },
      { scope: facebookPerms + (perms ? ',' + perms : '') }
    );
  }, cb);
};

window.globals.fbLogin = function (perms, cb) {
  window.globals.fbAuth(
    perms,
    function (fbId, fbAuthResponse) {
      if (!fbId) {
        cb({ error: 'no fb login' });
        return console.log('no fb login');
      }
      // try to logging in using fbUid and fb cookie
      var $fbForm = $('#fbForm').remove();
      //if (!$fbForm.length)
      $fbForm = $(
        '<form id="fbForm" action="/facebookLogin" method="post">' +
          '<input type="hidden" name="ajax" value="iframe"/>' +
          '<input type="hidden" name="fbUid" value="' +
          fbId +
          '"/>' +
          '<input type="hidden" name="fbAccessToken" value="' +
          fbAuthResponse.authResponse.accessToken +
          '"/>' +
          '</form>'
      ).appendTo('body');
      // TODO: make sure that jquery.iframe-post-form.min.js is loaded
      // if (!$('script[src*="jquery.iframe-post-form"]').length) ...
      $fbForm
        .iframePostForm({
          complete: function (res) {
            res = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1);
            res = JSON.parse(res);
            console.log('fbLogin response', res);
            if (res && res.error) console.log('fbLogin error', res.error);
            res.fbAuthResponse = fbAuthResponse.authResponse;
            res.fbAuthResponse.status = fbAuthResponse.status;
            // res can contain: error, redirect, fbUser...
            // res.fbUser contains: id, name, email...
            cb(res);
          },
        })
        .submit();
    },
    true
  );
};

window.globals.fbRegister = function (perms, cb) {
  window.globals.fbAuth(
    perms,
    function (fbId, fbAuthResponse) {
      if (!fbId) {
        cb({ error: 'no fb login' });
        return console.log('no fb login');
      }

      const options = {
        fields: 'last_name, first_name, email',
        access_token: fbAuthResponse.authResponse.accessToken,
      };

      window.globals.FB.api('/me', options, (response) => {
        cb({
          fbAuthResponse: fbAuthResponse.authResponse, // fbTok
          fbUser: {
            name: response.first_name + ' ' + response.last_name,
            email: response.email,
            id: fbId, // fbUid
          },
        });
      });
    },
    true
  );
};

window.globals.fbAsyncInit = function () {
  window.globals.FB.init({
    appId: fbId,
    version: 'v10.0',
    cookie: true,
    xfbml: true,
  });
  window.globals.whenFbReady = function (fct) {
    fct();
  };
  while (whenFbReadyQueue.length) whenFbReadyQueue.shift()();
};

// Load the SDK Asynchronously
(function (d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = 'https://connect.facebook.net/en_US/sdk.js';
  fjs.parentNode.insertBefore(js, fjs);
})(document, 'script', 'facebook-jssdk');
