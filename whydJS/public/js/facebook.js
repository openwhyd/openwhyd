var href = window.location.href + '/'

var namespace, fbId
if (href.indexOf('openwhyd.org/') > 0) {
  namespace = 'whydapp'
  fbId = '169250156435902'
} else if (href.indexOf('whyd.fr/') > 0) { // pre-production
  namespace = 'whyd-test'
  fbId = '1059973490696893'
} else {
  namespace = 'whyd-dev'
  fbId = '118010211606360'
};

var facebookPerms = 'public_profile,email,user_friends' // 'user_interests,user_likes,email,publish_stream';
var FB_ACTION_URI_PREFIX = href.substr(0, href.indexOf('/', 10)) // "http://openwhyd.org";

var whenFbReadyQueue = []

function whenFbReady (fct) {
  whenFbReadyQueue.push(fct)
}

function fbSafeCall (fct, failFct) {
  if (!window.FB) {
    showMessage('Unable to connect to Facebook. Did you block it?', true)
    if (failFct) { failFct() }
  } else { fct() }
}

function fbIsLogged (cb) {
  if (window.FB) {
    FB.getLoginStatus(function (response) {
      cb(response.status === 'connected' && window.user.fbId == response.authResponse.userID)
    }, true)
  } else if (cb) { cb(false) }
}

function fbPost (url, callback) {
  console.log('fbPost', url)
  if (window.FB) {
    FB.api(url, 'post', function (response) {
      console.log('fbPost response:', response)
      if (callback) { callback(response) }
    })
  } else if (callback) { callback() }
}

function fbSendMessage (obj, cb) {
  obj = obj || {}
  fbSafeCall(function () {
    obj.method = 'send'
    if (obj.link && obj.link.indexOf('http') != 0) { obj.link = FB_ACTION_URI_PREFIX + obj.link }
    console.log('sending fb message', obj)
    FB.ui(obj, function (response) {
		  if (response && response.success) // (response && response.post_id)
		    { cb && cb(response) } else {
		    console.log('unable to send fb message:', response)
		    cb && cb()
		  }
    })
  }, cb)
}

var verbToPrefName = {
  'add': 'ogAdd',
  'repost': 'ogAdd',
  'like': 'ogLik',
  'listen': 'ogPla'
}

function fbIsActionPermitted (verb) {
  return verb && verbToPrefName[verb] && user && user.pref && user.pref[verbToPrefName[verb]]
}

function fbAction (verb, uri, type, callback) {
  // console.log("fbAction", verb, uri, fbIsActionPermitted(verb));
  fbIsLogged(function (loggedIn) {
    if (loggedIn && fbIsActionPermitted(verb)) {
      var url = (verb == 'listen')
        ? '/me/music.listens?song=' + FB_ACTION_URI_PREFIX + uri.replace('/c/', '/post/')
        : '/me/' + namespace + ':' + verb + '?' + (type || 'website') + '=' + FB_ACTION_URI_PREFIX + uri
      fbPost(url, callback)
    } else if (callback) { callback() }
  })
}

function fbLike (uri, callback) {
  fbIsLogged(function (loggedIn) {
    if (loggedIn && fbIsActionPermitted('like')) { fbPost('/me/og.likes' + '?object=' + FB_ACTION_URI_PREFIX + uri, callback) } else if (callback) { callback() }
  })
}

function fbAuth (perms, cb, dontLink) {
  fbSafeCall(function () {
    FB.login(function (response) {
      console.log('fb response', response)
      response = response || {}
      cb((response.authResponse || {}).userID, response)

      // associate (store) the fbUid and accesstoken to the user in openwhyd DB
      if (!dontLink && response.authResponse) {
        $.ajax({
          type: 'POST',
          url: '/facebookLogin',
          data: {
            action: 'link',
            fbUid: response.authResponse.userID,
            fbAccessToken: response.authResponse.accessToken
          }
        })
      }
    }, {scope: facebookPerms + (perms ? ',' + perms : '')})
  }, cb)
}

function fbLogin (perms, cb) {
  fbAuth(perms, function (fbId, fbAuthResponse) {
    if (!fbId) {
      return console.log('no fb login')
      cb({error: 'no fb login'})
    }
    // try to logging in using fbUid and fb cookie
    var $fbForm = $('#fbForm').remove()
    // if (!$fbForm.length)
    $fbForm = $('<form id="fbForm" action="/facebookLogin" method="post">' +
				'<input type="hidden" name="ajax" value="iframe"/>' +
				'<input type="hidden" name="fbUid" value="' + fbId + '"/>' +
				'<input type="hidden" name="fbAccessToken" value="' + fbAuthResponse.authResponse.accessToken + '"/>' +
				'</form>').appendTo('body')
    // TODO: make sure that jquery.iframe-post-form.min.js is loaded
    // if (!$('script[src*="jquery.iframe-post-form"]').length) ...
    $fbForm.iframePostForm({complete: function (res) {
      res = res.substring(res.indexOf('{'), res.lastIndexOf('}') + 1)
      res = JSON.parse(res)
      console.log('fbLogin response', res)
      if (res && res.error) { console.log('fbLogin error', res.error) }
      res.fbAuthResponse = fbAuthResponse.authResponse
      res.fbAuthResponse.status = fbAuthResponse.status
      // res can contain: error, redirect, fbUser...
      // res.fbUser contains: id, name, email...
      cb(res)
    }}).submit()
  }, true)
}

function fbRegister (perms, cb) {
  fbAuth(perms, function (fbId, fbAuthResponse) {
    if (!fbId) {
      return console.log('no fb login')
      cb({error: 'no fb login'})
    }

    const options = {
      fields: 'last_name, first_name, email',
      access_token: fbAuthResponse.authResponse.accessToken
    }

    FB.api('/me', options, (response) => {
      cb({
        fbAuthResponse: fbAuthResponse.authResponse, // fbTok
        fbUser: {
          name: response.first_name + ' ' + response.last_name,
          email: response.email,
          id: fbId // fbUid
        }
      })
    })
  }, true)
}

// request-based invite
function fbInvite (fbUser) {
  // if coming from fbLogin, update the fbId of logged in user
  if (fbUser) { $.ajax({type: 'GET', url: '/api/user', data: {fbId: fbUser.id}}) }
  fbSafeCall(function () {
    FB.ui({method: 'apprequests', message: 'Show me your interests on whyd!'}, function (response) {
      console.log(response)
      // old requests 1.0 format
      if (response && response.request_ids) {
        invitedToConversation(null, {fbRequestIds: response.request_ids}, window.user.name + ' invited you to join whyd', function (params) {
          console.log('sent!')
        })
      } else if (response && response.request && response.to) {
        invitedToConversation(null, {fbRequestIds: response.request, fbTo: response.to}, window.user.name + ' invited you to join whyd', function (params) {
          console.log('sent!')
        })
      } else { console.log('invalid response') }
    })
  })
}

window.fbAsyncInit = function () {
  FB.init({appId: fbId, version: 'v2.3', status: true, cookie: true, oauth: true, xfbml: true})
  window.whenFbReady = function (fct) { fct() }
  while (whenFbReadyQueue.length) { (whenFbReadyQueue.shift())() }
}

whenFbReady(function () {
  console.log('watching fb events')
  FB.Event.subscribe('edge.create', function (targetUrl) {
    window.Whyd.tracking.logSocial('facebook', 'like', targetUrl)
  })
  FB.Event.subscribe('message.send', function (sharedUrl) {
    // var pId = sharedUrl.split("/").pop();
    // console.log("facebook invitation was sent", pId);
    window.Whyd.tracking.logSocial('facebook', 'message', sharedUrl)
  })
});

// Load the SDK Asynchronously
(function (d) {
  /* if (!d.getElementById("fb-root"))
		d.getElementsByTagName('body')[0].appendChild(d.createElement('div')).id = "fb-root"; */
  var js, id = 'facebook-jssdk'; if (d.getElementById(id)) { return }
  js = d.createElement('script'); js.id = id; js.async = true
  js.src = '//connect.facebook.net/en_US/sdk.js'
  d.getElementsByTagName('head')[0].appendChild(js)
}(document))
