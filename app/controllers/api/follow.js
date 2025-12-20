//@ts-check

// follow - called by the topic browser when the user favorites a topic

const snip = require('../../snip.js');
const followModel = require('../../models/follow.js');
const notifModel = require('../../models/notif.js');
const userModel = require('../../models/user.js');

const IMPLICIT_PARAMS = { _1: 'action', _2: 'id' }; //[null, "action", "id"];

const follow = async function (reqParams, dbHandler) {
  switch (reqParams.action) {
    case 'get': {
      followModel.get({ uId: reqParams.uId, tId: reqParams.tId }, dbHandler);
      break;
    }
    case 'insert': {
      if (!reqParams.uId || !reqParams.tId) return dbHandler();
      const followedUser = await new Promise((resolve) =>
        userModel.fetchByUid(reqParams.tId, resolve),
      );
      const obj = {
        uId: reqParams.uId,
        uNm: reqParams.uNm,
        tId: reqParams.tId,
        tNm: followedUser.name,
      };
      followModel.add(obj, dbHandler);
      notifModel.subscribedToUser(reqParams.uId, reqParams.tId /*.substr(3)*/);
      break;
    }
    case 'delete': {
      followModel.remove(reqParams.uId, reqParams.tId, dbHandler);
      break;
    }
    default: {
      dbHandler('bad request');
    }
  }
};

const PUBLIC_ACTIONS = {
  fetchFollowers: function (p, cb) {
    followModel.fetchFollowers(p.id, { skip: p.skip, limit: p.limit }, cb);
  },
  fetchFollowing: function (p, cb) {
    followModel.fetchFollowing(p.id, { skip: p.skip, limit: p.limit }, cb);
  },
};

function ranPublicAction(loggedUser, reqParams, cb) {
  const p = snip.translateFields(reqParams, IMPLICIT_PARAMS); //translateParams(reqParams);
  const action = PUBLIC_ACTIONS[p.action];
  if (action) {
    const fetchSubscriptionStatus = (res) => {
      const uids = snip
        .objArrayToValueArray(res, 'uId')
        .concat(snip.objArrayToValueArray(res, 'tId'));
      followModel.fetch(
        { uId: loggedUser.id, tId: { $in: uids } },
        null,
        function (subscrStatus) {
          const subscrSet = snip.objArrayToSet(subscrStatus, 'tId', true);
          for (const i in res)
            res[i].isSubscribing = subscrSet[res[i].uId || res[i].tId];
          cb(res);
        },
      );
    };
    action(p, !loggedUser || !p.isSubscr ? cb : fetchSubscriptionStatus);
    return true;
  }
}

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('follow.controller', reqParams);

  reqParams = reqParams || {};

  const sendResult = function (error, result) {
    result = result && result._id ? { _id: result._id } : {};
    if (error) {
      result.error = error;
    }

    if (reqParams.redirect) response.redirect(reqParams.redirect);
    else response.renderJSON(result);
  };

  const user = await request.checkLogin(/*response*/);
  if (
    ranPublicAction(user, reqParams, function (res) {
      response.renderJSON(res);
    })
  )
    return;

  // make sure a registered user is logged, or return an error page
  if (!user) return sendResult({ error: 'please login first' });

  reqParams.uId = user.id;
  reqParams.uNm = user.name;

  follow(reqParams, sendResult);
};
