/**
 * pgGenre controller
 * renders genre pages
 * @author adrienjoly, whyd
 **/

var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var emailModel = require('../models/email.js');
var notifEmails = require('../models/notifEmails.js');
var invitePage = require('../templates/invitePage.js');
var mainTemplate = require('../templates/mainTemplate.js');
var templateLoader = require('../templates/templateLoader.js');
var template = templateLoader.loadTemplate('app/templates/pgApp.html');

var apps = {
  heariam: {
    id: 'heariam',
    uId: '50be0bbf7e91c862b2a924da',
    name: 'Hear I Am',
    desc: 'Discover the best Music Lovers where you check-in',
    img: 'http://adrienjoly.com/heariam/icon.png',
  },
};

function renderSignupPage(p, cb) {
  console.log('app signup => rendering register page...');
  //var html = invitePage.renderInvitePage(sender, p.loggedUser, app.uId, null, null, user.fbRequestIds, reqParams.plC);
  var html = invitePage.renderSignupPage({
    loggedUser: p.loggedUser,
    inviteCode: p.app.uId, // => new user is invited by the app's user profile
    sender: { id: p.app.uId, name: p.app.name }, // => auto follow the app's user profile
    redirect: '/app/' + p.app.id, // => skip onboarding and go straight to app page
  });
  cb({ html: html });
}

function renderAppPage(p, cb) {
  templateLoader.loadTemplate('app/templates/pgApp.html', function (template) {
    cb({
      content: template.render({
        app: p.app,
        done1: !!p.loggedUser,
        loggedUser: p.loggedUser,
      }),
    });
  });
}

function sendWelcomeEmail(p, cb) {
  userModel.fetchByUid(p.loggedUser.id, function (user) {
    console.log(
      'app sending WHYD welcome email',
      user.email,
      p.sender.id,
      p.sender.name
    );
    notifEmails.sendRegWelcomeAsync(user, p.sender, cb);
    // heariam user receives an email as well, telling that his friend accepted his invitation to whyd
  });
}

function sendHeariamEmail(p) {
  userModel.fetchByUid(p.loggedUser.id, function (user) {
    user = user || {};
    console.log(
      'app sending HEARIAM welcome email',
      user.email,
      p.sender.id,
      p.sender.name
    );
    if (!user.email)
      return console.error('ERROR: user not found in sendHeariamEmail');
    emailModel.email(
      user.email,
      'Thank you for connecting Openwhyd to Hear I Am',
      [
        'Hey ' + user.name + '!',
        "Welcome to Hear I Am, we can't wait to introduce you to relevant music lovers near you!",
        'In the meantime, follow us on Twitter (http://twitter.com/hear_im), ' +
          'like us on Facebook (http://facebook.com/usehearim) in order to stay tuned with our developments, ' +
          "and of course don't forget to post great music on whyd!",
        'Best regards,',
        'Adrien and Loick, creators of Hear I Am',
        'http://hearim.net/',
      ].join('\n\n')
    );
  });
}
/*
function sendHeariamAdminEmail(p) {
	emailModel.email(
		ADMIN_EMAIL,
		"new openwhyd user connected to heariam",
		p.loggedUser.name + " : " + process.appParams.urlPrefix + "/u/" + p.loggedUser.id
		+ "\n\n(heariam/4sq id: "+ p.fid +")"
	);
}
*/
function getUserFromWid(wid, cb) {
  var user = mongodb.getUserFromId(wid);
  if (user) cb(user);
  else userModel.fetchByHandle(wid, cb);
}

function handleRequest(p, cb) {
  p = p || {};
  var app = apps[p.appId];
  if (!app) cb({ content: 'no such app...' });
  else if (p.action == 'signup')
    renderSignupPage(
      { app: app, loggedUser: p.loggedUser, ref: p.ref, email: p.email },
      cb
    );
  else if (p.action == 'connected' && p.appId == 'heariam') {
    // callback from heariam
    getUserFromWid(p.wid, function (user) {
      p.loggedUser = user || {};
      console.log('loggeduser from app', p.loggedUser);
      sendHeariamEmail({ loggedUser: p.loggedUser, sender: app });
      /*
			if (ADMIN_EMAIL)
				sendHeariamAdminEmail(p)
			*/
      cb({ text: "console.log('...and welcome to whyd!');" }); // this is run by hearim.net/welcome
    });
  } else {
    if (p.action == 'signedup' && p.loggedUser)
      sendWelcomeEmail({ loggedUser: p.loggedUser, sender: app });
    renderAppPage({ app: app, loggedUser: p.loggedUser }, cb);
  }
}

var FIELDS = {
  action: true,
  appId: true,
  wid: true,
  fid: true,
  ref: true, // referer (e.g. "email" sent by heariam newletter)
  email: true, // email address of the user, when coming from email newsletter
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('pgApp.controller', reqParams);
  reqParams = reqParams || {};

  var p = {
    loggedUser: request.getUser(response),
  };

  for (var f in reqParams) FIELDS[f] && (p[f] = reqParams[f]);

  function render(data) {
    data = data || {
      error:
        'Nothing to render! Please send the URL of this page to ' +
        process.appParams.feedbackEmail,
    };
    if (data.error) console.log('ERROR: ', data.error);
    if (data.content)
      data.html = mainTemplate.renderWhydPage({
        bodyClass: 'pgApp',
        loggedUser: p.loggedUser,
        pageUrl: request.url,
        content: data.content,
      });
    if (data.html) {
      response.renderHTML(data.html);
      console.log('rendering done!');
      //if (loggedInUser && loggedInUser.id && !reqParams.after && !reqParams.before)
      //	analytics.addVisit(loggedInUser, request.url/*"/u/"+uid*/);
    } else response.legacyRender(data.text || data.json || data.error);
  }

  handleRequest(p, render);
};
