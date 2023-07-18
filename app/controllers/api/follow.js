// follow - called by the topic browser when the user favorites a topic

var snip = require('../../snip.js');
var mongodb = require('../../models/mongodb.js');
var followModel = require('../../models/follow.js');
var notifModel = require('../../models/notif.js');
var userModel = require('../../models/user.js');

var IMPLICIT_PARAMS = { _1: 'action', _2: 'id' }; //[null, "action", "id"];

var follow = function (reqParams, dbHandler) {
  switch (reqParams.action) {
    case 'get':
      followModel.get({ uId: reqParams.uId, tId: reqParams.tId }, dbHandler);
      break;
    case 'insert':
      var obj = {
        uId: reqParams.uId,
        uNm: reqParams.uNm,
        tId: reqParams.tId,
        tNm: reqParams.tNm,
      };
      if (!obj.uId || !obj.tId) return dbHandler();
      //if (reqParams.recom) obj.recom = true;
      followModel.add(obj, dbHandler);
      //if (reqParams.tId.startsWith("/u/"))
      notifModel.subscribedToUser(reqParams.uId, reqParams.tId /*.substr(3)*/);
      break;
    case 'delete':
      followModel.remove(reqParams.uId, reqParams.tId, dbHandler);
      break;
    default:
      dbHandler('bad request');
  }
};

var PUBLIC_ACTIONS = {
  fetchFollowers: function (p, cb) {
    followModel.fetchFollowers(p.id, { skip: p.skip, limit: p.limit }, cb);
  },
  fetchFollowing: function (p, cb) {
    followModel.fetchFollowing(p.id, { skip: p.skip, limit: p.limit }, cb);
  },
};

function ranPublicAction(loggedUser, reqParams, cb) {
  var p = snip.translateFields(reqParams, IMPLICIT_PARAMS); //translateParams(reqParams);
  var action = PUBLIC_ACTIONS[p.action];
  if (action) {
    const fetchSubscriptionStatus = (res) => {
      var uids = snip
        .objArrayToValueArray(res, 'uId')
        .concat(snip.objArrayToValueArray(res, 'tId'));
      followModel.fetch(
        { uId: loggedUser.id, tId: { $in: uids } },
        null,
        function (subscrStatus) {
          var subscrSet = snip.objArrayToSet(subscrStatus, 'tId', true);
          for (let i in res)
            res[i].isSubscribing = subscrSet[res[i].uId || res[i].tId];
          cb(res);
        }
      );
    };
    action(p, !loggedUser || !p.isSubscr ? cb : fetchSubscriptionStatus);
    return true;
  }
}

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('follow.controller', reqParams);

  reqParams = reqParams || {};

  var sendResult = function (error, result) {
    result = result && result._id ? { _id: result._id } : {};
    if (error) {
      result.error = error;
      console.log('follow API error: ' + error);
    }

    if (reqParams.redirect) response.redirect(reqParams.redirect);
    else response.renderJSON(result);
  };

  var user = request.checkLogin(/*response*/);
  if (
    ranPublicAction(user, reqParams, function (res) {
      response.renderJSON(res);
    })
  )
    return;

  // make sure a registered user is logged, or return an error page
  if (!user) return sendResult({ error: 'please login first' });

  if (reqParams.tId) {
    reqParams.tNm = (
      await new Promise((resolve) =>
        userModel.fetchByUid(reqParams.tId, resolve)
      )
    ).name;
  }

  reqParams.uId = user.id;
  reqParams.uNm = user.name;

  follow(reqParams, sendResult);
};
