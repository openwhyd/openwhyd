/**
 * invites management console
 * @author adrienjoly, whyd
 **/

const mongodb = require('../../models/mongodb.js');
const userModel = require('../../models/user.js');
const notifEmails = require('../../models/notifEmails.js');
const mainTemplate = require('../../templates/mainTemplate.js');

const callWhenDone = require('../../snip.js').callWhenDone;

const fetchUsers = function (table, handler, options) {
  console.log('fetching users from ' + table + '...');
  mongodb.collections[table]
    .find({}, options)
    .toArray()
    .then(
      (res) => handler(null, res),
      (err) => handler(err),
    );
};

const inviteUser = function (email, handler) {
  console.log('invite user ', email);
  userModel.inviteUser(email, function (storedUser) {
    if (storedUser) notifEmails.sendAcceptedInvite(storedUser);
    handler(storedUser);
  });
  return true;
};

async function renderUserList(users, title, actionNames) {
  let userList = '<h2>' + title + ' (' + users.length + ')</h2>';

  if (users && users.length) {
    const fieldName = users[0].email ? 'email' : 'fbId';
    userList +=
      '<p style="position:relative;top:-5px;color:gray;">' +
      '<input type="checkbox" onClick="toggle(\'' +
      fieldName +
      "', '" +
      title +
      '\', this)" />toggle all</p>';
  }
  //<input type="hidden" name="list" value="'+name+'" />';

  for (const i in users) {
    const u = users[i];
    let date = u.date || u._id.getTimestamp();
    date =
      date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    const fieldName = u.email ? 'email' : 'fbId'; //(u.fbId ? "fbId" : "email");
    const userId = u.email || u.fbId;

    const img =
      u.img ||
      (u.fbId
        ? '//graph.facebook.com/v2.3/' + u.fbId + '/picture?type=square'
        : null);

    const link =
      title == 'invites'
        ? '/invite/' + u._id
        : u.name
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
        ? '<br/>&nbsp;invited by ' +
            (await userModel.fetchUserNameById(u.iBy)) || 'unknown'
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
    for (const i in actionNames)
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

async function renderTemplate(requests, invites) {
  const params = { title: 'whyd invites', css: ['admin.css'], js: [] };

  const out = [
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
    await renderUserList(requests, /*"req",*/ 'requests', ['invite', 'delete']),
    await renderUserList(invites, /*"inv",*/ 'invites', [
      /*"resend",*/ 'delete',
    ]),
    //	renderUserList(users, /*"usr",*/ "registered users", ["delete"]),
    '<script>',
    'function getSelectedCheckbox(buttonGroup) {',
    '   // Go through all the check boxes. return an array of all the ones',
    '   // that are selected (their position numbers). if no boxes were checked,',
    '   // returned array will be empty (length will be zero)',
    '   var retArr = new Array();',
    '   var lastElement = 0;',
    '   if (buttonGroup[0]) { // if the button group is an array (one check box is not an array)',
    '      for (let i=0; i<buttonGroup.length; i++) {',
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
    '	for (let i in checkboxes)',
    '		checkboxes[i].checked = source.checked;',
    '}',
    '</script>',
  ].join('\n');

  return mainTemplate.renderWhydFrame(out, params);
}

exports.handleRequest = async function (request, reqParams, response) {
  request.logToConsole('invites.controller', reqParams);

  // make sure an admin is logged, or return an error page
  const user = await request.checkAdmin(response);
  if (!user) return;

  const fetchAndRender = async function () {
    const [users, invites, requests] = await Promise.all([
      fetchUsers('user', (err, res) => res, { sort: [['_id', 'desc']] }),
      fetchUsers('invite', (err, res) => res, { sort: [['_id', 'desc']] }),
      fetchUsers('email', (err, res) => res, { sort: [['date', 'desc']] }),
    ]);
    for (const i in requests)
      requests[i] = {
        _id: requests[i]._id,
        email: requests[i]._id,
        date: requests[i].date,
      };
    response.legacyRender(
      await renderTemplate(requests, invites, users, reqParams),
      null,
      { 'content-type': 'text/html' },
    );
  };

  reqParams = reqParams || {};

  if (reqParams.action && reqParams.title) {
    let emails = reqParams.email || [];
    if (typeof emails == 'string') emails = [emails];
    if (reqParams.title == 'requests') {
      if (reqParams.action == 'invite') {
        const sync = callWhenDone(fetchAndRender);
        for (const i in emails) {
          const processing = inviteUser(emails[i], function () {
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
		}*/ else response.badRequest();
  } else fetchAndRender();
};

exports.controller = async function (request, getParams, response) {
  if (request.method.toLowerCase() === 'post') {
    //var form = new formidable.IncomingForm();
    //form.parse(request, function(err, postParams) {
    //	if (err) console.log(err);
    await exports.handleRequest(request, request.body /*postParams*/, response);
    //});
  } else await exports.handleRequest(request, getParams, response);
};
