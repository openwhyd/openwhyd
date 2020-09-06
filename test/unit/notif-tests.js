/* global describe, it */

process.appParams = {
  urlPrefix: '',
  mongoDbHost: process.env['MONGODB_HOST'] || 'localhost',
  mongoDbPort: process.env['MONGODB_PORT'] || mongodb.Connection.DEFAULT_PORT, // 27017
  mongoDbAuthUser: process.env['MONGODB_USER'],
  mongoDbAuthPassword: process.env['MONGODB_PASS'],
  mongoDbDatabase: process.env['MONGODB_DATABASE'], // || "openwhyd_data",
};

const consoleBackup = console.log;
console.log = () => {}; // prevent mongodb from adding noise to stdout

const util = require('util');
const assert = require('assert');
var mongodb = require('../../app/models/mongodb.js');
var notifModel = require('../../app/models/notif.js');

var db = mongodb.collections;
var ObjectId = mongodb.ObjectId;

const initDb = () =>
  new Promise((resolve, reject) => {
    mongodb.init(function (err) {
      if (err) {
        reject(err);
        return;
      }
      var mongodbInstance = this;
      // var initScript = './config/initdb.js';
      // mongodbInstance.runShellScript(
      //   require('fs').readFileSync(initScript),
      //   function (err) {
      //     if (err) throw err;
      mongodbInstance.cacheCollections(function () {
        mongodb.cacheUsers(() => {
          console.log = consoleBackup; // now that we're done with db init => re-enable logging to stdout
          resolve();
        });
      });
      //   }
      // );
    });
  });

describe('notif', function () {
  this.timeout(5000);

  it('initiatialises db', initDb);

  var p = {
    loggedUser: require('../fixtures.js').ADMIN_USER, //request.getUser(),
    session: {}, //request.session,
    cookie: '', //"whydSid=" + (request.getCookies() || {})["whydSid"]
  };

  var user = p.loggedUser;
  var uId = p.loggedUser.id;
  var POLL_TIMEOUT = 4000;

  var users = [
    {
      id: '4d7fc1969aa9db130e000003',
      _id: ObjectId('4d7fc1969aa9db130e000003'),
      name: 'Gilles (test)',
    },
    {
      id: '4dd4060ddb28e240e8508c28',
      _id: ObjectId('4dd4060ddb28e240e8508c28'),
      name: 'Loick (test)',
    },
  ];

  users.forEach((user) => mongodb.cacheUser(user)); // populate mongodb.usernames for notif endpoints

  var fakePost = {
    _id: ObjectId('4fe3428e9f2ec28c92000024'), //ObjectId("4ed3de428fed15d73c00001f"),
    uId: user.id,
    name: 'Knust hjerte by Casiokids (test)',
    eId: '/sc/casiokids/knust-hjerte#http://api.soundcloud.com/tracks/35802590',
  };

  var comments = users.map(function (u) {
    return {
      _id: ObjectId('4ed3de428fed15d73c00001f'),
      pId: '' + fakePost._id,
      uId: u.id,
      uNm: u.name,
      text: 'coucou (test)',
    };
  });

  var NOTIF_COUNT = 10; // 4 common records + 2 * 3 individual records. (see below)

  function testAllNotifs(u) {
    // 1 record per user
    notifModel.subscribedToUser(users[u].id, user.id);
    notifModel.html(
      user.id,
      'coucou <small>html</small>',
      'http://www.facebook.com',
      '/images/logo-s.png'
    );
    notifModel.mention(fakePost, comments[u], user.id);

    // 1 common record
    notifModel.love(users[u].id, fakePost);
    notifModel.comment(fakePost, comments[u]);
    notifModel.commentReply(fakePost, comments[u], user.id);
    notifModel.repost(users[u].id, fakePost);
  }

  function pollUntil(fct, cb) {
    var t0 = Date.now();
    var interv = setInterval(function () {
      fct(function (err) {
        var inTime = Date.now() - t0 <= POLL_TIMEOUT;
        if (!err || !inTime) {
          clearInterval(interv);
          cb(!inTime);
        }
      });
    }, 500);
  }

  function fetchNotifs(uId, cb) {
    notifModel.getUserNotifs(uId, (notifs) => cb(null, notifs));
  }

  function makeNotifChecker(expectedCount) {
    return function checkNotifs(cb) {
      fetchNotifs(uId, function (err, notifs) {
        cb(!(notifs.length == expectedCount));
      });
    };
  }

  const countEmptyNotifs = (cb) => db['notif'].count({ uId: { $size: 0 } }, cb);

  async function clearAllNotifs() {
    await util.promisify(notifModel.clearUserNotifs)(uId);
    const notifs = await util.promisify(fetchNotifs)(uId);
    assert(notifs.length === 0, 'failed to clear all notifs');
  }

  it('can clean notifications db', async () => {
    // remove documents with empty uid
    await db['notif'].remove({ uId: { $size: 0 } }, { multi: true });
    const count = await countEmptyNotifs();
    assert(count === 0, 'failed to remove notifs with empty uid');
  });

  it('can add a "love" notification', async () => {
    await clearAllNotifs();
    await notifModel.love(users[0].id, fakePost);
    await util.promisify(pollUntil)(makeNotifChecker(1));
  });

  it('can add sample notifications', async () => {
    await clearAllNotifs();
    for (let u in users) nbNotifs = testAllNotifs(u);
    await util.promisify(pollUntil)(makeNotifChecker(NOTIF_COUNT));
  });

  it('can clear individual notifications', async () => {
    // setup: re-add sample notifications (again)
    await clearAllNotifs();
    for (let u in users) nbNotifs = testAllNotifs(u);
    await util.promisify(pollUntil)(makeNotifChecker(NOTIF_COUNT));
    // action: clear individual notifications
    const notifs = await util.promisify(fetchNotifs)(uId);
    for (let i in notifs) notifModel.clearUserNotifsForPost(uId, notifs[i].pId);
    await util.promisify(pollUntil)(makeNotifChecker(0));
    // expect: db is clean
    const count = await countEmptyNotifs();
    assert(count === 0, 'failed to clear all individual notifications');
  });

  it('fails when calling notif.sendTrackToUsers() with no parameters', async () => {
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(null, resolve)
    );
    assert.equal(res.error, 'object is null');
  });

  it('fails when calling notif.sendTrackToUsers() without pId parameter', async () => {
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(
        { uId: users[0].id, uNm: users[0].name, uidList: [uId] },
        resolve
      )
    );
    assert.equal(res.error, 'missing field: pId');
  });

  it('fails when calling notif.sendTrackToUsers() with a object-typed pId parameter', async () => {
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(
        {
          uId: users[0].id,
          uNm: users[0].name,
          uidList: [uId],
          pId: fakePost,
        },
        resolve
      )
    );
    assert.equal(res.error, 'mistyped field: pId');
  });

  it('can receive a notification from Gilles', async () => {
    await clearAllNotifs();
    // action: send the notif
    var p = {
      uId: users[0].id,
      uNm: users[0].name,
      uidList: [uId],
      pId: '' + fakePost._id,
    };
    await new Promise((resolve) => notifModel.sendTrackToUsers(p, resolve));
    // expect: the notif is received by recipient
    await util.promisify(pollUntil)(makeNotifChecker(1));
    const notifs = await util.promisify(fetchNotifs)(user.id);
    const n = notifs.length === 1 && notifs[0];
    // (note / warning: pId field is the _id of the notif, not the id of the post)
    assert(n.t && n.html, 't and html props should be set');
    assert.strictEqual(n.type, 'Snt');
    assert.strictEqual(n.lastAuthor.id, p.uId);
    assert.strictEqual(n.img, n.track.img);
    assert(n.track.img.indexOf(p.pId) > -1, 'track.img should include the pId');
    assert(n.href.indexOf(p.pId) > -1, 'href should include the pId');
  });

  [
    // ---
    ['clear all notifications', (cb) => clearAllNotifs().then(cb)],

    // TODO: send to several users at once

    // ---

    [
      'gilles sends a playlist to me',
      function (cb) {
        var p = {
          uId: users[0].id,
          uNm: users[0].name,
          uidList: [uId],
          plId: users[0].id + '_' + 0, // gilles' 1st playlist
        };
        var plUri = p.plId.replace('_', '/playlist/');
        notifModel.sendPlaylistToUsers(p, function (res) {
          pollUntil(makeNotifChecker(1), function (inTime) {
            fetchNotifs(user.id, function (err, notifs) {
              var n = notifs.length === 1 && notifs[0];
              // warning: pId field is the _id of the notif, not the id of the post
              cb(
                !(
                  n.t &&
                  n.html &&
                  n.type === 'Snp' &&
                  n.lastAuthor.id === p.uId &&
                  n.img === n.track.img &&
                  n.track.img.indexOf(p.plId) > -1 &&
                  n.href.indexOf(plUri) > -1
                )
              );
            });
          });
        });
      },
    ],
    ['clear all notifications', (cb) => clearAllNotifs().then(cb)],

    [
      'gilles sends a track to me => res._id is populated',
      function (cb) {
        var p = {
          uId: users[0].id,
          uNm: users[0].name,
          uidList: [uId],
          pId: '' + fakePost._id,
        };
        notifModel.sendTrackToUsers(p, function (res) {
          cb(!!!res._id);
        });
      },
    ],
    ['clear all notifications', (cb) => clearAllNotifs().then(cb)],
  ].forEach(function (test) {
    it(
      test[0],
      () =>
        new Promise((resolve, reject) =>
          test[1]((err) => (err ? reject(new Error('failed')) : resolve()))
        )
    );
  });
});
