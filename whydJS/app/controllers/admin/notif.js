/**
 * notif console
 * @author adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js')
var userModel = require('../../models/user.js')
var mainTemplate = require('../../templates/mainTemplate.js')

function renderTemplate (user) {
  var out = []
  for (var field in userModel.DEFAULT_PREF) {
    if (field.indexOf('mn') == 0) { out.push('<p>' + field + ': <input name="pref[' + field + ']" value="' + user.pref[field] + '"></p>') }
  }
  out = [
    '<h1>whyd notif console</h1>',
    '► <a href="/">home</a>',
    '<p>apTok: ' + JSON.stringify(user.apTok || []) + '</p>',
    '<form method="post" action="/api/user">',
    '<p>apTok: <input name="apTok" value="' + (((user.apTok || []).pop() || {}).tok || '') + '"></p>',
    out.join('\n'),
    '<input type="submit">',
    '</form>'
  ].join('\n')
  return mainTemplate.renderWhydFrame(out, {
    title: 'whyd notif console',
    css: [],
    js: []
  })
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('notif.admin.controller', reqParams)
  if (!request.checkAdmin(response)) { return }
  userModel.fetchByUid(request.getUser().id, function (user) {
    response.renderHTML(renderTemplate(user))
  })
}
