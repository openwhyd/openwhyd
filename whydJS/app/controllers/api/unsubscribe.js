/**
 * unsubscribe api controller
 * allow users to unsubscribe from email notifications in one click
 * @author adrienjoly, whyd
 */

var userModel = require('../../models/user.js')

var getNextFreq = (function () {
  var FREQS = []
  for (var i in userModel.EM_FREQ_LABEL) { FREQS.push(parseInt(i)) }
  FREQS.sort()
  FREQS.shift() // remove -1, the "less frequent" value

  return function (f) {
    console.log('detected freq:', f)
    if (f > -1) {
      for (var i in FREQS) {
        if (FREQS[i] > f) {
          console.log('new freq:', FREQS[i])
          return FREQS[i]
        }
      }
    }
    return -1
  }
})()
/*
(function tests() {
	console.log("getNextFreq tests");
	var cases = [-1, 0, 1, 2, 7, 8];
	for (var i in cases)
		console.log("case:", cases[i], " => ", getNextFreq(cases[i]));
})();
*/

var EM_TYPES = []
for (var i in userModel.DEFAULT_PREF) {
  if (i.indexOf('em') == 0) { EM_TYPES.push(i) }
}

function setNotifFreq (user, freq, cb) {
  var pref = {}
  for (var i in EM_TYPES) { pref[EM_TYPES[i]] = freq }
  userModel.setPref(user._id || user.id, pref, cb)
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('unsubscribe.controller', reqParams)

  function render (r) {
    if (!r) {
      response.redirect('/settings')
      return
    }
    if (r.pwd) { delete r.pwd }
    // updated email notif frequency
    if (r.pref) {
      var newFreqlabel = userModel.EM_FREQ_LABEL['' + userModel.getEmailNotifsFreq(r)]
      var html = 'Starting now, the frequency of email notifications you will receive is set to: ' + newFreqlabel
      html = '<p>' + html + "</p><p><a href='/settings'>Edit your settings</a></p>"
      response.render(html, null, {'content-type': 'text/html'})
    } else { response.render(r) }
    /*
		if (r && r.html)
			response.render(r.html, null, {'content-type': 'text/html'});
		else {
			if (!r || r.error) {
				console.log("unsubscribe.controller ERROR:", (r || {}).error || r);
			response.render(r);
		}
		*/
  };

  if (reqParams && reqParams.uId) {
    var user = request.getUserFromId(reqParams.uId)
    if (!user) {
      console.log({error: 'user not found'})
      return render({error: 'user not found'})
    }
    if (reqParams.type && userModel.DEFAULT_PREF[reqParams.type] != undefined) {
      var prefModif = {}
      prefModif['pref.' + reqParams.type] = -1
      // userModel.setPref(user._id || user.id, prefModif, render);
      userModel.update(user.id, {$set: prefModif}, render)
      return
    }

    var newFreq = -1 // "never send notification emails", by default (real "unsubscribe")
    if (reqParams.action && reqParams.action == 'reduce') { newFreq = getNextFreq(userModel.getEmailNotifsFreq(user)) }
    setNotifFreq(user, newFreq, render)
  } else { render() }
}
