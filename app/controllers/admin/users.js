/**
 * user management console
 * @author adrienjoly, whyd
 **/

const snip = require('../../snip.js');
const userModel = require('../../models/user.js');
const AdminLists = require('../../templates/adminLists.js').AdminLists;

// ACTION HANDLERS

/** @typedef {{auth?: import('../../lib/my-http-wrapper/http/AuthFeatures.js').AuthFeatures}} Features */

/** @type {Record<string, (params: any, cb: (any) => void, features: Features) => void>} */
const handlers = {
  rename: function (p, cb, features) {
    if (p._id && p.name)
      userModel.renameUser(features, p._id, p.name, function (result) {
        result = result || {};
        if (result.error) console.trace('user rename error:', result.error);
        else result.message = 'The user name has been set to ' + p.name;
        cb(result);
      });
    else cb({ error: 'missing arguments' });
  },
  delete: function (p, cb, features) {
    const id = p._id && p._id.join ? p._id[0] : p._id;
    if (id) {
      console.log('delete user ', id);
      userModel.delete(features, { _id: id }, function (res) {
        res = res || {};
        res.json = JSON.parse(JSON.stringify(res));
        cb(res);
      });
    } else cb({ error: 'missing arguments' });
  },
};

// ADMIN CONSOLE TEMPLATES

function renderItem(item) {
  let date = item.date || item._id.getTimestamp();
  date =
    date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
  return {
    id: item.id || item._id,
    name: item.name,
    nameSuffix: item.handle ? ' (' + item.handle + ')' : '',
    href: '/u/' + (item.id || item._id),
    //	img: item.img  || (item.fbId ? 'http://graph.facebook.com/v2.3/'+item.fbId+'/picture?type=square' : null),
    info: [
      /*"Email: " +*/ item.email,
      //	(item.handle ? "handle: " + item.handle : null),
      'Registered on ' +
        date +
        (item.fbId
          ? ', using <a href="https://www.facebook.com/profile.php?id=' +
            item.fbId +
            '">FB</a>'
          : ''),
      (item.iBy
        ? 'invited by ' +
          snip.htmlEntities(
            (async () => {
              const inviter = await userModel.fetchAndProcessUserById(item.iBy);
              return (inviter || {}).name;
            })() || 'unknown',
          )
        : '') +
        (item.iPo ? ' from <a href="/c/' + item.iPo + '">post</a>' : '') +
        (item.iPg ? ' from <a href="' + item.iPg + '">page</a>' : '') +
        (item.iRf ? ' via <a href="' + item.iRf + '">referrer</a>' : ''),
    ],
  };
}

function renderTemplate(items) {
  const users = [];
  for (const i in items) users.push(renderItem(items[i]));

  const console = new AdminLists();
  console.addWideList(users, 'Users', ['rename', 'delete'], {});

  // the handler will be called AFTER the confirmation dialog
  console.addScript(
    [
      '$("input[value=rename]").click(function(e){',
      '	e.preventDefault();',
      '	var _id = getSelectedCheckbox(document.forms[0]._id).shift();', // take the first selected item
      '	var oldName = $("input[value="+_id+"]").parent().find(".itemName").text().trim();',
      '	if (!oldName)',
      '		return alert("You must check a user first, then click on rename.");',
      '	var newName = prompt("Enter the new name for this user", oldName);',
      '	if (newName && confirm("Please confirm that " + oldName + " will be renamed to " + newName))',
      '		window.location.href="?action=rename&_id="+_id+"&name="+encodeURIComponent(newName);',
      '	else',
      '		alert("aborted rename request");',
      '	return false;',
      '});',
    ].join('\n'),
  );

  return console.renderPage({ title: 'whyd user management console' });
}

// MAIN CONTROLLER / REQUEST HANDLING CODE

exports.handleRequest = function (request, reqParams, response, features) {
  request.logToConsole('admin/users.controller', reqParams);

  // make sure an admin is logged, or return an error page
  const user = request.checkAdmin(response);
  if (!user) return;

  function renderResult(result) {
    result = result || {};
    if (result.json) {
      response.renderJSON(result.json);
      return;
    }
    const html =
      result.html ||
      (result.error
        ? '<h1>error</h1><p>' + result.error + '</p>'
        : '<h1>success</h1><p>' + result.message + '</p>') +
        'Go <a href="/admin/users">back to user management console</a>';
    response.legacyRender(html, null, { 'content-type': 'text/html' });
  }

  reqParams = reqParams || {};

  if (reqParams.action && handlers[reqParams.action])
    handlers[reqParams.action](reqParams, renderResult, features);
  else
    userModel.fetchMulti(
      {},
      { sort: [['_id', 'desc']], limit: 600 },
      function (users) {
        renderResult({ html: renderTemplate(/*mongodb.usernames*/ users) });
      },
    );
};

/** @param {Features} features */
exports.controller = function (request, getParams, response, features) {
  //request.logToConsole("admin/users.controller", request.method);
  if (request.method.toLowerCase() === 'post') {
    //var form = new formidable.IncomingForm();
    //form.parse(request, function(err, postParams) {
    //	if (err) console.log(err);
    exports.handleRequest(
      request,
      request.body /*postParams*/,
      response,
      features,
    );
    //});
  } else exports.handleRequest(request, getParams, response, features);
};
