/**
 * invite controller
 * renders pages to invite and sign up invited users
 * @author adrienjoly, whyd
 */

var config = require('../models/config.js')
var users = require('../models/user.js')
var analytics = require('../models/analytics.js')
var notifEmails = require('../models/notifEmails.js')
var invitePage = require('../templates/invitePage.js')
var inviteFormTemplate = require('../templates/inviteForm.js')
var templateLoader = require('../templates/templateLoader.js')
var makeSignupToken = require('../genuine.js').makeSignupToken

// genuine signup V1
var EXPECTED_RTK = '7', // rTk = request token (necessary to fetch sTk)
  INVALID_STK = makeSignupToken({ connection: { remoteAddress: '' } }) // fake sTk, to be returned when requested using wrong rTk
// TODO: replace constants by dynamic values, according to https://quip.com/YmOJAl8OIOaM

// only used to generate the signup token indirectly from the web ui
function checkRequestToken (rTk) {
  return EXPECTED_RTK == rTk
}

exports.checkInviteCode = function (request, reqParams, response, okCallback) {
  users.fetchInvite(reqParams.inviteCode, function (user) {
    if (user) {
      console.log('found invite:', user)
      if (okCallback) okCallback(user)
    } else {
      // ALLOW USER ID TO BE USED AS INVITE CODE
      users.fetchByUid(reqParams.inviteCode, function (user) {
        if (user && user._id) {
          console.log('found user from inviteCode (fake invite):', user._id, user.name)
          if (okCallback) {
            okCallback({
            /* inviteCode */ _id: /* ""+ */user._id,
              iBy: '' + user._id,
              iPg: request.url
            })
          }
        } else {
          console.log('invitation token not found => redirecting to /')
          response.redirect('/')
        }
      })
    }
  })
}

/**
 * called when user follows an invite URL (/invite/xxx), e.g. provided in an email
 */
exports.renderRegisterPage = function (request, reqParams, response, error) {
  if (!reqParams) reqParams = {}
  if (reqParams.id) reqParams.inviteCode = reqParams.id // for compatibility with previous versions of routes.conf

  request.logToConsole('invite.renderRegisterPage', {
    inviteCode: reqParams.inviteCode,
    email: reqParams.email,
    name: reqParams.name,
    error: reqParams.error,
    iBy: reqParams.iBy, // invited by user iBy
    iPo: reqParams.iPo, // from post iPo (legacy)
    plC: reqParams.plC // playlist contest id => will skip autofollow/onboarding and redirect to playlist page
  })

  function render (user) {
    var user = user || {}
    // invitePage.refreshTemplates(function() {
    var sender = request.getUserFromId(user.iBy)
    var registrationPage = invitePage.renderInvitePage(sender, request.getUser(),
      user._id, user.pId, reqParams.email || user.email || '', user.fbRequestIds, reqParams.plC, reqParams.redirect)
    response.render(registrationPage, null, {'content-type': 'text/html'})
    // });
  }

  if (reqParams.inviteCode) { exports.checkInviteCode({url: request.url}, reqParams, response, render) }
  /*
	else if (config.landingStream && request.url.startsWith("/signup"))
		render();
	*/

  // signup pop-in
  else if (reqParams.popin) {
    templateLoader.loadTemplate('app/templates/popinSignup.html', function (template) {
      var page = template.render(reqParams)
      response.renderHTML(page)
    })
  } else {
    // console.log("inviteCode parameter is required");
    response.redirect('/#signup')
    return false
  }
}

var renderInviteForm = function (request, reqParams, response) {
  request.logToConsole('invite.renderInviteForm', reqParams)
  if (!reqParams) reqParams = {}

  reqParams.loggedUser = request.checkLogin(response) // getUser();
  if (!reqParams.loggedUser) return

  var html = inviteFormTemplate.renderInviteFormPage(reqParams)
  response.render(html, null, {'content-type': 'text/html'})

  analytics.addVisit(reqParams.loggedUser, request.url/* "/u/"+uid */)
}

var submitInvites = function (request, reqParams, response) {
  console.log('POST params', reqParams)
  var loggedUser = request.getUser()
  if (!loggedUser || !reqParams) { response.badRequest() } else if (reqParams.email && reqParams.email.join && reqParams.email.length) { // === invite by email
    var successEmails = []
    var message = reqParams.message && reqParams.message != '' ? reqParams.message : null
    for (var i in reqParams.email) {
      if (reqParams.email[i]) {
        users.inviteUserBy(reqParams.email[i], '' + loggedUser._id, function (invite) {
          if (invite) {
            notifEmails.sendInviteBy(loggedUser.name, invite._id, invite.email, message)
            successEmails.push(invite.email)
          }
        })
      }
    }
    response.render({ok: 1, email: successEmails})
  } else if (reqParams.email && typeof reqParams.email === 'string') { // === invite by email (1)
    users.inviteUserBy(reqParams.email, '' + loggedUser._id, function (invite) {
      if (invite) { notifEmails.sendInviteBy(loggedUser.name, invite._id, invite.email, message) }
      response.render({ok: !!invite, email: invite ? invite.email : undefined})
    })
  } else if (reqParams.fbId) // === invite facebook friend
  {
    users.inviteFbUserBy(reqParams.fbId, '' + loggedUser._id, function (invite) {
      response.render(!invite ? null : { ok: 1, fbId: reqParams.fbId, inviteCode: invite._id })
    })
  } else { response.badRequest() }
}

exports.controller = function (request, reqParams, response, error) {
  request.logToConsole('invite.controller'/*, request.method */)
  reqParams = reqParams || {}
  if (request.method.toLowerCase() === 'post') { submitInvites(request, request.body, response) } else if (request.method.toLowerCase() === 'delete' && reqParams.inviteCode && request.checkLogin()) {
    users.removeInvite(reqParams.inviteCode, function (i) {
      console.log('deleted invite', i)
      response.render(i)
    })
  } else if (reqParams.rTk) { // GET /api/signup/rTk/{rTk}
    // check validity of request token => generate a signup token
    var sTk = checkRequestToken(reqParams.rTk) ? makeSignupToken(request) : INVALID_STK
    var js = '$(\'<input type="hidden" name="sTk" value="' + sTk + '" />\').appendTo("form");'
    response.render(js, null, {'content-type': 'text/javascript'})
  } else if (reqParams.inviteCode || (/* config.landingStream && */ request.url.startsWith('/signup'))) { exports.renderRegisterPage(request, reqParams, response, error) } else { renderInviteForm(request, reqParams, response) }
}
