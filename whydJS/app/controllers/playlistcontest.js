/**
 * playlist contest controller (derived by "discover")
 * @author adrienjoly, whyd
 */

var contestModel = require('../models/plContest.js')
var userModel = require('../models/user.js')
var contestTemplate = require('../templates/playlistcontest.js')
var mainTemplate = require('../templates/mainTemplate.js')
var inviteCtr = require('../controllers/invite.js')

// === main code ===

exports.controller = function (request, getParams, response) {
  request.logToConsole('playlistcontest.controller', getParams || request.body)

  var loggedUser = request.getUser()
  var isAdmin = loggedUser && request.isAdmin()

  function render (result) {
    if (!result || result.error) {
      console.log('playlistcontest error:', (result || {}).error)
      // response.redirect("/");
    }
    if (result && result.html) { response.renderHTML(result.html) } else { response.render(result) }
  }

  function wrap (html) {
    return {
      html: mainTemplate.renderWhydPage({
        loggedUser: loggedUser,
        content: html
      })
    }
  }

  function joinContest (plC) {
    if (!plC || !plC.uri) { return render({error: (plC || {}).error || 'hmm... are you sure that this contest still exists?'}) }
    if (loggedUser) {
      console.log('logged user', loggedUser)
      // response.temporaryRedirect("/u/"+loggedUser.id+"/playlist/create?name=" + encodeURIComponent(plC.title));
      userModel.hasPlaylistNameByUid(loggedUser.id, plC.title, function (playlist) {
        if (playlist) { response.temporaryRedirect('/u/' + loggedUser.id + '/playlist/' + playlist.id) } else {
          userModel.createPlaylist(loggedUser.id, plC.title, function (playlist) {
            response.temporaryRedirect('/u/' + loggedUser.id + '/playlist/' + playlist.id)
          })
        }
      })
    } else {
      // render({error:"please login first"});
      console.log('user is trying to join a contest without being logged in => rendering register page...')
      var registerParams = {
        inviteCode: plC.uId, // => new user is invited by the contest organizer
        iBy: plC.uId, // => auto follow the contest organizer
        plC: '' + plC._id // => skip onboarding, send specific email, and go straight to playlist page
      }
      inviteCtr.renderRegisterPage(request, registerParams, response)
    }
  }

  if (getParams && getParams.action == 'info' && getParams.uri && isAdmin) {
    contestModel.fetchOne(getParams.uri, function (plC) {
      render(!plC || !plC.uri ? {error: (plC || {}).error} : wrap(contestTemplate.renderInfoPage(plC)))
    })
  } else if (getParams && getParams.action == 'join' && getParams.uri) {
    contestModel.fetchOne(getParams.uri, function (plC) {
    // render(!plC || !plC.uri ? {error: (plC || {}).error} : wrap(contestTemplate.renderJoinPage(plC)));
      joinContest(plC)
    })
  } else if (getParams && getParams.uri == 'list' && isAdmin) {
    contestModel.fetch(function (list) {
    // console.log("list of contests", list);
      render(!list || list.error ? {error: (list || {}).error} : wrap(contestTemplate.renderListPage(list)))
    })
  } else if (getParams && getParams.uri) {
    contestModel.fetchOne(getParams.uri, function (plC) {
      if (!plC || plC.error) { render({error: (plC || {}).error || 'Contest not found'}) } else { response.redirect(plC.url) }
    })
  } else if (request.method.toLowerCase() == 'get' /* && isAdmin */) {
    getParams = getParams || {}
    getParams.lang = getParams.lang ? getParams.lang.toUpperCase() : 'EN'
    contestTemplate.refreshTemplates(function () {
      render({html: mainTemplate.renderWhydPage({
        bodyClass: 'pgPlContest ' + 'lang' + getParams.lang,
        loggedUser: loggedUser,
        content: contestTemplate.renderCreatePage({
          loggedUser: loggedUser,
          isAdmin: isAdmin,
          lang: getParams.lang
        })
      })})
      // analytics.addVisit(getParams.loggedUser, request.url);
    })
  } else if (request.body.action == 'save' && isAdmin) {
    request.body.loggedUser = request.getUser()
    contestModel.save(request.body, /* render */ function (plC) {
      if (!plC || !plC.uri) { render({error: (plC || {}).error}) } else { response.redirect('/playlistcontest/' + plC.uri + '/info') }
    })
  } else { response.badRequest() }
}
