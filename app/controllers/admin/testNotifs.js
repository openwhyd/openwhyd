// test notif model

const mongodb = require('../../models/mongodb.js');
const ObjectId = mongodb.ObjectId;
const notifModel = require('../../models/notif.js');

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('admin.testNotifs', reqParams);

  const user = await request.checkLogin(response);
  if (!user) return;

  // reset prefs: db.user.updateOne({_id:ObjectId("4d94501d1f78ac091dbc9b4d")},{$unset:{"pref":1}});

  const gilles = {
    id: '4d7fc1969aa9db130e000003',
    _id: ObjectId('4d7fc1969aa9db130e000003'),
    name: 'Gilles',
  };

  const fakePost = {
    _id: ObjectId('4fe3428e9f2ec28c92000024'), //ObjectId("4ed3de428fed15d73c00001f"),
    uId: user.id,
    name: 'Knust hjerte by Casiokids',
    eId: '/sc/casiokids/knust-hjerte#http://api.soundcloud.com/tracks/35802590',
  };

  const fakeComment = {
    _id: ObjectId('4ed3de428fed15d73c00001f'),
    pId: '' + fakePost._id,
    uId: gilles.id,
    uNm: gilles.name,
    text: 'coucou',
  };

  notifModel.love(gilles.id, fakePost);
  notifModel.repost(gilles.id, fakePost);
  notifModel.subscribedToUser(gilles.id, user.id);
  notifModel.html(
    user.id,
    'coucou <small>html</small>',
    'http://www.facebook.com',
    '/images/logo-s.png',
  );
  notifModel.comment(fakePost, fakeComment);
  notifModel.mention(fakePost, fakeComment, user.id);
  notifModel.commentReply(fakePost, fakeComment, user.id);

  response.legacyRender('done');
};
