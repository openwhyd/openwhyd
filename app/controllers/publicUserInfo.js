//@ts-check

/**
 * publicUserInfo controller
 * renders public user info in JSON format
 **/

const mongodb = require('../models/mongodb.js');
const userModel = require('../models/user.js');

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('publicUserInfo.controller', reqParams);

  const { id, handle } = reqParams;

  const returnUser = (user) => {
    const responseBody = !user
      ? { error: 'User not found' }
      : { _id: user._id, handle: user.handle, name: user.name };

    if (reqParams.callback) {
      // the callback parameter is used for JSONP responses, for use from client-side JS
      const safeCallback = reqParams.callback.replace(/[^a-z0-9_]/gi, '');
      response
        .set({ 'content-type': 'application/javascript' })
        .send(safeCallback + '(' + JSON.stringify(responseBody) + ')');
    } else {
      // regular JSON response
      response.renderJSON(responseBody);
    }
  };

  if (id && mongodb.isObjectId(id)) {
    returnUser(
      await new Promise((resolve) => userModel.fetchByUid(id, resolve)),
    );
  } else if (handle) {
    returnUser(
      await new Promise((resolve) => userModel.fetchByHandle(handle, resolve)),
    );
  } else {
    response.badRequest({ error: 'Bad request' });
  }
};
