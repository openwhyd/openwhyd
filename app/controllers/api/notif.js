/**
 * notif controller
 * returns user's notifications
 * @author adrienjoly, whyd
 */

const mongodb = require('../../models/mongodb.js');
const notifModel = require('../../models/notif');
//var formidable = require('formidable'); // for POST request handling

exports.handlePostRequest = function (request, postParams, response) {
  request.logToConsole('notif.controller', postParams);

  switch (postParams.action) {
    case 'test':
      var TEST_USER = {
        _id: '000000000000',
        id: '000000000000',
        name: 'test user',
      };
      mongodb.usernames[TEST_USER.id] = TEST_USER;
      notifModel.subscribedToUser(TEST_USER.id, request.getUid(), function () {
        delete mongodb.usernames[TEST_USER.id];
        response.renderJSON({ ok: true });
      });
      break;
    case 'deleteAll':
      notifModel.clearUserNotifs(request.getUid());
      response.renderJSON({ ok: true });
      break;
    case 'delete':
      notifModel.clearUserNotifsForPost(request.getUid(), postParams.pId);
      response.renderJSON({ ok: true });
      break;
    default:
      console.log('warning: unrecognized action');
  }
};

exports.controller = async function (req, reqParams, res) {
  //req.logToConsole("notif.controller", reqParams);
  const user = await req.checkLogin(/*res*/);
  if (!user) return res.legacyRender(); // replace by render(null) if user not logged

  if (req.method.toLowerCase() === 'post') {
    exports.handlePostRequest(req, req.body, res);
  } else
    notifModel.getUserNotifs(user.id, function (notifs) {
      res.renderJSON(notifs);
    });
};
