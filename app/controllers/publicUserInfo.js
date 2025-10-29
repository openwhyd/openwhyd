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

  if (id && mongodb.isObjectId(id)) {
    userModel.fetchByUid(id, function (user) {
      response.renderJSON(
        !user
          ? { error: 'User not found' }
          : { _id: user._id, handle: user.handle, name: user.name },
      );
    });
  } else if (handle) {
    userModel.fetchByHandle(handle, function (user) {
      response.renderJSON(
        !user
          ? { error: 'User not found' }
          : { _id: user._id, handle: user.handle, name: user.name },
      );
    });
  } else {
    response.badRequest();
  }
};
