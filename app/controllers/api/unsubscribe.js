/**
 * unsubscribe api controller
 * allow users to unsubscribe from email notifications in one click
 * @author adrienjoly, whyd
 */

const userModel = require('../../models/user.js');

const getNextFreq = (function () {
  const FREQS = [];
  for (const i in userModel.EM_FREQ_LABEL) FREQS.push(parseInt(i));
  FREQS.sort();
  FREQS.shift(); // remove -1, the "less frequent" value

  return function (f) {
    console.log('detected freq:', f);
    if (f > -1)
      for (const i in FREQS)
        if (FREQS[i] > f) {
          console.log('new freq:', FREQS[i]);
          return FREQS[i];
        }
    return -1;
  };
})();
/*
(function tests() {
	console.log("getNextFreq tests");
	var cases = [-1, 0, 1, 2, 7, 8];
	for (let i in cases)
		console.log("case:", cases[i], " => ", getNextFreq(cases[i]));
})();
*/

const EM_TYPES = [];
for (const i in userModel.DEFAULT_PREF)
  if (i.indexOf('em') == 0) EM_TYPES.push(i);

function setNotifFreq(user, freq, cb) {
  const pref = {};
  for (const i in EM_TYPES) pref[EM_TYPES[i]] = freq;
  userModel.setPref(user._id || user.id, pref, cb);
}

function withLink(html) {
  return '<p>' + html + "</p><p><a href='/settings'>Edit your settings</a></p>";
}

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('unsubscribe.controller', reqParams);

  function render(r) {
    if (!r) {
      response.redirect('/settings');
      return;
    }
    if (r.pwd) delete r.pwd;
    // updated email notif frequency
    if (r.pref && reqParams.action == 'reduce') {
      const newFreqlabel =
        userModel.EM_FREQ_LABEL[
          reqParams.type
            ? r.pref[reqParams.type]
            : '' + userModel.getEmailNotifsFreq(r)
        ];
      const html =
        'Starting now, the frequency of email notifications you will receive is set to: ' +
        newFreqlabel;
      response.legacyRender(withLink(html), null, {
        'content-type': 'text/html',
      });
    } else if (r.pref) {
      // user unsubscribed
      const type = userModel.EM_LABEL[reqParams.type] || 'all';
      const html =
        'You successfully unsubscribed from email notifications: ' + type;
      response.legacyRender(withLink(html), null, {
        'content-type': 'text/html',
      });
    } else {
      response.legacyRender(r);
    }
    /*
		if (r && r.html)
			response.legacyRender(r.html, null, {'content-type': 'text/html'});
		else {
			if (!r || r.error) {
				console.log("unsubscribe.controller ERROR:", (r || {}).error || r);
			response.legacyRender(r);
		}
		*/
  }

  if (!reqParams || !reqParams.uId) {
    return render(); // missing uId parameter => let's redirect to /settings
  }

  const user = await userModel.fetchAndProcessUserById(reqParams.uId);
  if (!user) {
    return render({ error: 'user not found' });
  }

  const type =
    userModel.DEFAULT_PREF[reqParams.type] != undefined ? reqParams.type : null;

  const reduce = reqParams.action && reqParams.action == 'reduce';

  const newFreq = reduce
    ? getNextFreq(type ? user.pref[type] : userModel.getEmailNotifsFreq(user))
    : -1; // unsubscribe by default

  // if `type` parameter is provided, the user will be unsubscribed from that type of notification
  if (type) {
    const prefModif = {};
    prefModif['pref.' + reqParams.type] = newFreq;
    //userModel.setPref(user._id || user.id, prefModif, render);
    userModel.update(user.id, { $set: prefModif }, render);
  } else {
    // missing `type` parameter => change settings for all notifications emails
    setNotifFreq(user, newFreq, render);
  }
};
