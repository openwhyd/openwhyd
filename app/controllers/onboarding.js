/**
 * onboarding controller
 * handles the onboarding process (for new users)
 * @author adrienjoly, whyd
 */

// testing phase 3: send welcome email
// $ curl -v --data "ajax=follow" --cookie "whydSid=4j8OSWWYknxyPlmGmgqURg12AiBoKDQpqt4iU610PT9nKkIkRdlMgHWF9kFMsQEvU" http://openwhyd.org/onboarding

var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var analytics = require('../models/analytics.js');
var notifModel = require('../models/notif.js');
var notifEmails = require('../models/notifEmails.js');

var TEMPLATE_FILE = 'app/templates/onboarding.html';
var mainTemplate = require('../templates/mainTemplate.js');
var templateLoader = require('../templates/templateLoader.js');
const { getSuggestedUsers } = require('../models/featuredUsers.js');

// var MAX_RECOM_USERS = 10;

var templates = {
  'bookmarklet-legacy': 'app/templates/onboarding/bookmarklet.html', // old version (still bound to openwhyd.org/bookmarklet and openwhyd.org/button)
};

function makeTemplateRenderer(cb) {
  return function (p) {
    templateLoader.loadTemplate(templates[p.step] || TEMPLATE_FILE, function (
      template
    ) {
      p.content = template.render(p);
      cb(p);
    });
  };
}

var processAjax = {
  people: function (_, cb) {
    getSuggestedUsers().then(cb);
  },
  follow: function (p, cb) {
    userModel.fetchByUid(p.loggedUser.id, function (user) {
      console.log('onboarding, sending welcome email', user.email, user.iBy);
      var inviteSender = user.iBy ? mongodb.getUserFromId(user.iBy) : null;
      notifEmails.sendRegWelcomeAsync(user, inviteSender);
    });

    console.log('onboarding, following uids:', p.uids);
    var uids = (p.uids || '').split(',');
    (function next() {
      var uid = uids.pop();
      if (uid)
        followModel.add(
          {
            uId: p.loggedUser.id,
            uNm: p.loggedUser.name,
            tId: uid,
            tNm: mongodb.getUserNameFromId(uid),
            ctx: 'onb', // onb = onboarding context
          },
          function () {
            console.log('onboarding, followed uid', uid);
            notifModel.subscribedToUser(p.loggedUser.id, uid, next);
          }
        );
    })();
    cb({ ok: true });
  },
};

var processStep = {
  people: function (p, render) {
    (p.css = p.css || []).push('onboarding.css');
    p.bodyClass = 'pgOnboarding stepPeople minimalHeader';
    p.stepPeople = true;
    render(p);
  },
  button: function (p, render) {
    (p.css = p.css || []).push('onboarding.css');
    p.bodyClass = 'pgOnboarding stepButton minimalHeader';
    p.stepButton = true;
    render(p);
  },
  'bookmarklet-legacy': function (p, render) {
    render(p);
  },
};

function handleRequest(p, cb) {
  if (p.ajax && processAjax[p.ajax]) {
    processAjax[p.ajax](p, cb);
  } else {
    var lastUrlWord = p.pageUrl.split('?')[0].split('/')[1];
    if (lastUrlWord == 'bookmarklet' || lastUrlWord == 'button')
      p.step = 'bookmarklet-legacy';

    var processor = processStep[p.step];
    if (!processor) cb({ error: 'unknown step' });
    //cb({redirect:"/"});
    else {
      processor(p, makeTemplateRenderer(cb));
      analytics.addVisit(p.loggedUser, p.pageUrl);
    }
  }
}

exports.controller = function (request, getParams, response) {
  var p =
    (request.method.toLowerCase() === 'post' ? request.body : getParams) || {};
  request.logToConsole('onboarding.controller ' + request.method, p);
  // make sure user is logged in
  if (!(p.loggedUser = request.checkLogin(response))) return;
  p.pageUrl = request.url;
  handleRequest(p, function (r) {
    if (!r || r.error) {
      r = r || {};
      console.log(r.error);
      //response.temporaryRedirect("/welcome");
    } else if (r.content) r.html = mainTemplate.renderWhydPage(r);

    if (r.redirect) response.temporaryRedirect(r.redirect);
    else if (r.html) response.renderHTML(r.html);
    else response.renderJSON(r);
  });
};
