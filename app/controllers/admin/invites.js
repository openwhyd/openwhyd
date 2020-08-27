/**
 * invites management console
 * @author adrienjoly, whyd
 **/

//var formidable = require('formidable'); // for POST request handling

//var util = require("util");
var mongodb = require('../../models/mongodb.js');
//var db = mongodb.model;
var userModel = require('../../models/user.js');
var notifEmails = require('../../models/notifEmails.js');
//var AdminLists = require("../../templates/adminLists").AdminLists;
var mainTemplate = require('../../templates/mainTemplate.js');

var callWhenDone = require('../../snip.js').callWhenDone;

var fetchUsers = function (table, handler, options) {
  console.log('fetching users from ' + table + '...');
  mongodb.collections[table].find({}, options, function (err, cursor) {
    cursor.toArray(handler);
  });
};

var inviteUser = function (email, handler) {
  console.log('invite user ', email);
  userModel.inviteUser(email, function (storedUser) {
    if (storedUser) notifEmails.sendAcceptedInvite(storedUser);
    handler(storedUser);
  });
  return true;
};

function renderUserList(users, title, actionNames) {
  var userList = '<h2>' + title + ' (' + users.length + ')</h2>';

  if (users && users.length) {
    var fieldName = users[0].email ? 'email' : 'fbId';
    userList +=
      '<p style="position:relative;top:-5px;color:gray;">' +
      '<input type="checkbox" onClick="toggle(\'' +
      fieldName +
      "', '" +
      title +
      '\', this)" />toggle all</p>';
  }
  //<input type="hidden" name="list" value="'+name+'" />';

  for (var i in users) {
    var u = users[i];
    var date = u.date || u._id.getTimestamp();
    date =
      date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    var fieldName = u.email ? 'email' : 'fbId'; //(u.fbId ? "fbId" : "email");
    var userId = u.email || u.fbId;

    var img =
      u.img ||
      (u.fbId
        ? '//graph.facebook.com/v2.3/' + u.fbId + '/picture?type=square'
        : null);

    if (title == 'invites') var link = '/invite/' + u._id;
    else
      var link = u.name
        ? '/u/' + u._id
        : /*u.email ? "mailto:" + u.email :*/ null;

    if (u.fbRequestIds)
      u.fbInvites = u.fbRequestIds.join
        ? u.fbRequestIds.length + ' fb invites'
        : '1 fb invite';

    userList +=
      '<p style="clear:both;">' +
      (actionNames
        ? '<input type="checkbox" name="' +
          fieldName +
          '" value="' +
          userId +
          '" />'
        : '') +
      (img
        ? '<img src="' +
          img +
          '" width="24px" height="24px" style="float:left;"/>&nbsp;'
        : '') +
      (link ? '<a href="' + link + '">' : '') +
      (u.fbInvites || u.name || u.email) +
      (link ? '</a>' : '') +
      (u.fbId
        ? '&nbsp;(<a href="//www.facebook.com/profile.php?id=' +
          u.fbId +
          '">FB</a>)'
        : '') +
      '<small>' +
      (u.name ? '<br/>&nbsp;' + u.email : '') +
      (u.iBy
        ? '<br/>&nbsp;invited by ' + (mongodb.usernames[u.iBy] || {}).name
        : '') +
      (u.iPo
        ? '<br/>&nbsp;from post #<a href="/c/' + u.iPo + '">' + u.iPo + '</a>'
        : '') +
      (u.iPg
        ? '<br/>&nbsp;from page <a href="' + u.iPg + '">' + u.iPg + '</a>'
        : '') +
      (u.iRf
        ? '<br/>&nbsp;via referrer <a href="' + u.iRf + '">' + u.iRf + '</a>'
        : '') +
      ' (' +
      date +
      ')</small>' +
      '</p>';
  }

  if (actionNames) {
    userList += '<input type="hidden" name="title" value="' + title + '" />';
    for (var i in actionNames)
      userList +=
        '<input type="submit" name="action" value="' +
        actionNames[i] +
        '"' +
        ' onclick="return confirm(\'Your are going to ' +
        actionNames[i] +
        " the following user(s):\\n' + getSelectedCheckbox(form.email) + '\\nAre you sure?')\" />";

    userList =
      '<form name="' + title + '" method="post">' + userList + '</form>';
  }

  return '<div class="userList">' + userList + '</div>';
}

function renderTemplate(requests, invites, users, reqParams) {
  var params = { title: 'whyd invites', css: ['admin.css'], js: [] };

  var out = [
    '<h1>whyd invites management console</h1>',
    '► <a href="/">home</a>',
    //	'► this page was generated on '+(new Date()),
    '► <a href="?' +
      new Date().getTime() +
      '">REFRESH</a> (please use this link instead of browser\'s refresh)',
    '<p>Invite by email: ',
    '<form method="post">',
    '<input name="email">',
    '<input type="hidden" name="title" value="requests" />',
    '<input type="submit" name="action" value="invite">',
    '</form>',
    //'params = ' + util.inspect(reqParams),
    renderUserList(requests, /*"req",*/ 'requests', ['invite', 'delete']),
    renderUserList(invites, /*"inv",*/ 'invites', [/*"resend",*/ 'delete']),
    //	renderUserList(users, /*"usr",*/ "registered users", ["delete"]),
    '<script>',
    'function getSelectedCheckbox(buttonGroup) {',
    '   // Go through all the check boxes. return an array of all the ones',
    '   // that are selected (their position numbers). if no boxes were checked,',
    '   // returned array will be empty (length will be zero)',
    '   var retArr = new Array();',
    '   var lastElement = 0;',
    '   if (buttonGroup[0]) { // if the button group is an array (one check box is not an array)',
    '      for (var i=0; i<buttonGroup.length; i++) {',
    '         if (buttonGroup[i].checked) {',
    '            retArr.length = lastElement;',
    '            retArr[lastElement] = buttonGroup[i].value;',
    '            lastElement++;',
    '         }',
    '      }',
    "   } else { // There is only one check box (it's not an array)",
    '      if (buttonGroup.checked) { // if the one check box is checked',
    '         retArr.length = lastElement;',
    '         retArr[lastElement] = buttonGroup.value; // return zero as the only array value',
    '      }',
    '   }',
    '   return retArr;',
    '}',
    'function toggle(fieldName, formName, source) {',
    //'	checkboxes = document.getElementsByName(name);',
    '	checkboxes = document.forms[formName].elements[fieldName];',
    '	for (var i in checkboxes)',
    '		checkboxes[i].checked = source.checked;',
    '}',
    '</script>',
  ].join('\n');

  return mainTemplate.renderWhydFrame(out, params);
}

exports.handleRequest = function (request, reqParams, response) {
  request.logToConsole('invites.controller', reqParams);

  // make sure an admin is logged, or return an error page
  var user = request.checkAdmin(response);
  if (!user /*|| !(user.fbId == "510739408" || user.fbId == "577922742")*/)
    return /*response.legacyRender("you're not an admin!")*/;

  var fetchAndRender = function () {
    fetchUsers(
      'user',
      function (err, users) {
        fetchUsers(
          'invite',
          function (err, invites) {
            fetchUsers(
              'email',
              function (err, requests) {
                for (var i in requests)
                  requests[i] = {
                    _id: requests[i]._id,
                    email: requests[i]._id,
                    date: requests[i].date,
                  };

                response.legacyRender(
                  renderTemplate(requests, invites, users, reqParams),
                  null,
                  { 'content-type': 'text/html' }
                );
                console.log('rendering done!');
              },
              { sort: [['date', 'desc']] }
            );
          },
          { sort: [['_id', 'desc']] }
        );
      },
      { sort: [['_id', 'desc']] }
    );
  };

  reqParams = reqParams || {};

  if (reqParams.action && reqParams.title) {
    var emails = reqParams.email || [];
    if (typeof emails == 'string') emails = [emails];
    if (reqParams.title == 'requests') {
      if (reqParams.action == 'invite') {
        var sync = callWhenDone(fetchAndRender);
        for (var i in emails) {
          var processing = inviteUser(emails[i], function (user) {
            sync(-1);
          });
          if (processing) sync(+1);
        }
      } else if (reqParams.action == 'delete' && emails.length) {
        console.log('delete emails ', emails);
        userModel.deleteEmails(emails, fetchAndRender);
        return true;
      }
    } else if (
      reqParams.title == 'invites' &&
      reqParams.action == 'delete' &&
      emails.length
    ) {
      console.log('delete invites ', emails);
      userModel.removeInviteByEmail(emails, fetchAndRender);
    } /*
		else if (reqParams.title == "registered users" && reqParams.action == "delete" && emails.length) {
			console.log("delete user ", emails[0]);
			userModel.delete({email:emails[0]}, fetchAndRender);
		}*/ else
      response.badRequest();
  } else fetchAndRender();
};

exports.controller = function (request, getParams, response) {
  if (request.method.toLowerCase() === 'post') {
    //var form = new formidable.IncomingForm();
    //form.parse(request, function(err, postParams) {
    //	if (err) console.log(err);
    exports.handleRequest(request, request.body /*postParams*/, response);
    //});
  } else exports.handleRequest(request, getParams, response);
};
