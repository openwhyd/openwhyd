/* global $ */

const globals = window;

var href = window.location.href + '/';

var fbId;
if (href.indexOf('openwhyd.org/') > 0) {
  // namespace = 'whydapp';
  fbId = '169250156435902';
} /*else if (href.indexOf('whyd.fr/') > 0) {
  // pre-production
  namespace = 'whyd-test';
  fbId = '1059973490696893';
} */ else {
  // namespace = 'whyd-dev';
  fbId = '118010211606360';
}

var facebookPerms = 'public_profile,email';

var whenFbReadyQueue = [];

globals.whenFbReady = function (fct) {
  whenFbReadyQueue.push(fct);
};

const fbSafeCall = function (fct, failFct) {
  if (!globals.FB) {
    globals.showMessage(
      'Unable to connect to Facebook. Did you block it?',
      true
    );
    if (failFct) failFct();
  } else fct();
};

globals.fbIsLogged = function (cb) {
  if (globals.FB)
    globals.FB.getLoginStatus(function (response) {
      cb(
        response.status === 'connected' &&
          globals.user.fbId == response.authResponse.userID
      );
    }, true);
  else if (cb) cb(false);
};

globals.fbAuth = function (perms, cb, dontLink) {
  fbSafeCall(function () {
    globals.FB.login(
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

globals.fbLogin = function (perms, cb) {
  globals.fbAuth(
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

globals.fbRegister = function (perms, cb) {
  globals.fbAuth(
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

      globals.FB.api('/me', options, (response) => {
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

globals.fbAsyncInit = function () {
  globals.FB.init({
    appId: fbId,
    version: 'v2.3',
    status: true,
    cookie: true,
    oauth: true,
    xfbml: true,
  });
  globals.whenFbReady = function (fct) {
    fct();
  };
  while (whenFbReadyQueue.length) whenFbReadyQueue.shift()();
};

globals.whenFbReady(function () {
  console.log('watching fb events');
  globals.FB.Event.subscribe('edge.create', function (targetUrl) {
    globals.Whyd.tracking.logSocial('facebook', 'like', targetUrl);
  });
  globals.FB.Event.subscribe('message.send', function (sharedUrl) {
    //var pId = sharedUrl.split("/").pop();
    //console.log("facebook invitation was sent", pId);
    globals.Whyd.tracking.logSocial('facebook', 'message', sharedUrl);
  });
});

// Load the SDK Asynchronously
(function (d) {
  /*if (!d.getElementById("fb-root"))
		d.getElementsByTagName('body')[0].appendChild(d.createElement('div')).id = "fb-root";*/
  var js,
    id = 'facebook-jssdk';
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement('script');
  js.id = id;
  js.async = true;
  js.src = '//connect.facebook.net/en_US/sdk.js';
  d.getElementsByTagName('head')[0].appendChild(js);
})(document);
