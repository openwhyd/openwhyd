//@ts-check

const assert = require('assert');
const notifModel = require('../../app/models/notif.js');

const { ObjectId } = require('mongodb');
const { initMongoDb } = require('../mongodb-client.js'); // uses MONGODB_HOST, MONGODB_PORT, MONGODB_USER, MONGODB_PASS, MONGODB_DATABASE env vars
const { ADMIN_USER, resetTestDb } = require('../fixtures.js');

let mongodb, db;

const POLL_TIMEOUT = 4000;

// test data

const USERS = [
  {
    id: '4d7fc1969aa9db130e000003',
    _id: new ObjectId('4d7fc1969aa9db130e000003'),
    name: 'Gilles (test)',
  },
  {
    id: '4dd4060ddb28e240e8508c28',
    _id: new ObjectId('4dd4060ddb28e240e8508c28'),
    name: 'Loick (test)',
  },
];

const FAKE_POST = {
  _id: new ObjectId('4fe3428e9f2ec28c92000024'),
  uId: ADMIN_USER.id,
  name: 'Knust hjerte by Casiokids (test)',
  eId: '/sc/casiokids/knust-hjerte#http://api.soundcloud.com/tracks/35802590',
};

const COMMENTS = USERS.map(function (u) {
  return {
    _id: new ObjectId('4ed3de428fed15d73c00001f'),
    pId: '' + FAKE_POST._id,
    uId: u.id,
    uNm: u.name,
    text: 'coucou (test)',
  };
});

// test helpers

async function initDb() {
  mongodb = await initMongoDb({ silent: true });
  db = mongodb.collections;
  // Insert users directly into the database instead of using cacheUser
  for (const user of USERS) {
    await db['user'].updateOne(
      { _id: user._id },
      { $set: user },
      { upsert: true },
    );
  }
}

const countEmptyNotifs = (cb) =>
  db['notif'].countDocuments({ uId: { $size: 0 } }, cb);

const fetchNotifs = (uId) =>
  new Promise((resolve) => notifModel.getUserNotifs(uId, resolve));

async function clearAllNotifs() {
  await notifModel.clearAllNotifs();
  const notifs = await fetchNotifs(ADMIN_USER.id);
  assert(notifs.length === 0, 'failed to clear all notifs');
}

function makeNotifChecker(expectedCount) {
  return async function checkNotifs(cb) {
    const notifs = await notifModel.fetchAllNotifs();
    cb(notifs.length !== expectedCount);
  };
}

const pollUntil = (fct) =>
  new Promise((resolve, reject) => {
    const t0 = Date.now();
    const interv = setInterval(function () {
      fct((err) => {
        const inTime = Date.now() - t0 <= POLL_TIMEOUT;
        if (!err || !inTime) {
          clearInterval(interv);
          if (!inTime) reject(new Error('timeout'));
          else resolve();
        }
      });
    }, 500);
  });

function testAllNotifs(u) {
  // 1 record per user
  notifModel.subscribedToUser(USERS[u].id, ADMIN_USER.id);
  notifModel.html(
    ADMIN_USER.id,
    'coucou <small>html</small>',
    'http://www.facebook.com',
    '/images/logo-s.png',
  );
  notifModel.mention(FAKE_POST, COMMENTS[u], ADMIN_USER.id);

  // 1 common record
  notifModel.love(USERS[u].id, FAKE_POST);
  notifModel.comment(FAKE_POST, COMMENTS[u]);
  notifModel.commentReply(FAKE_POST, COMMENTS[u], ADMIN_USER.id);
  notifModel.repost(USERS[u].id, FAKE_POST);
}

async function addAllNotifs() {
  const NOTIF_COUNT = USERS.length * 3 + 4; // 3 individual records per user + 4 common records (see testAllNotifs())
  for (const u in USERS) /*nbNotifs =*/ testAllNotifs(u);
  await pollUntil(makeNotifChecker(NOTIF_COUNT));
}

// test suite

describe('notifications', function () {
  this.timeout(5000);

  // reset database state and seed fixtures (including ADMIN_USER)
  before(async () => await resetTestDb({ env: process.env, silent: true }));

  before(initDb);

  it('can clean notifications db', async () => {
    // remove documents with empty uid
    await db['notif'].deleteMany({ uId: { $size: 0 } });
    const count = await countEmptyNotifs();
    assert(count === 0, 'failed to remove notifs with empty uid');
  });

  it('can add a "love" notification', async () => {
    await clearAllNotifs();
    await notifModel.love(USERS[0].id, FAKE_POST);
    await pollUntil(makeNotifChecker(1));
  });

  it('can add sample notifications', async () => {
    await clearAllNotifs();
    await addAllNotifs();
  });

  it('can clear individual notifications', async () => {
    // setup: re-add sample notifications (again)
    await clearAllNotifs();
    await addAllNotifs();
    // action: clear individual notifications
    const notifs = await fetchNotifs(ADMIN_USER.id);
    for (const i in notifs)
      notifModel.clearUserNotifsForPost(ADMIN_USER.id, notifs[i].pId);
    await pollUntil(makeNotifChecker(0));
    // expect: db is clean
    const count = await countEmptyNotifs();
    assert(count === 0, 'failed to clear all individual notifications');
  });

  it('fails when calling notif.sendTrackToUsers() with no parameters', async () => {
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(null, resolve),
    );
    assert.equal(res.error, 'object is null');
  });

  it('fails when calling notif.sendTrackToUsers() without pId parameter', async () => {
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(
        { uId: USERS[0].id, uNm: USERS[0].name, uidList: [ADMIN_USER.id] },
        resolve,
      ),
    );
    assert.equal(res.error, 'missing field: pId');
  });

  it('fails when calling notif.sendTrackToUsers() with a object-typed pId parameter', async () => {
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(
        {
          uId: USERS[0].id,
          uNm: USERS[0].name,
          uidList: [ADMIN_USER.id],
          pId: FAKE_POST,
        },
        resolve,
      ),
    );
    assert.equal(res.error, 'mistyped field: pId');
  });

  it('can receive a track notification from Gilles', async () => {
    await clearAllNotifs();
    // action: send the notif
    const p = {
      uId: USERS[0].id,
      uNm: USERS[0].name,
      uidList: [ADMIN_USER.id],
      pId: '' + FAKE_POST._id,
    };
    const res = await new Promise((resolve) =>
      notifModel.sendTrackToUsers(p, resolve),
    );
    // expect: the notif is received by recipient
    await pollUntil(makeNotifChecker(1));
    const notifs = await fetchNotifs(ADMIN_USER.id);
    const n = notifs.length === 1 && notifs[0];
    // (note / warning: pId field is the _id of the notif, not the id of the post)
    assert(res._id, 'sendTrackToUsers() should return the _id of the notif');
    assert(n.t && n.html, 't and html props should be set');
    assert.strictEqual(n.type, 'Snt');
    assert.strictEqual(n.lastAuthor.id, p.uId);
    assert.strictEqual(n.img, n.track.img);
    assert(n.track.img.indexOf(p.pId) > -1, 'track.img should include the pId');
    assert(n.href.indexOf(p.pId) > -1, 'href should include the pId');
    // TODO: also test sending to several users at once
  });

  it('can receive a playlist notification from Gilles', async () => {
    await clearAllNotifs();
    // action: send the notif
    const p = {
      uId: USERS[0].id,
      uNm: USERS[0].name,
      uidList: [ADMIN_USER.id],
      plId: USERS[0].id + '_' + 0, // gilles' 1st playlist
    };
    const plUri = p.plId.replace('_', '/playlist/');
    await new Promise((resolve) => notifModel.sendPlaylistToUsers(p, resolve));
    // expect: the notif is received by recipient
    await pollUntil(makeNotifChecker(1));
    const notifs = await fetchNotifs(ADMIN_USER.id);
    const n = notifs.length === 1 && notifs[0];
    // (note / warning: pId field is the _id of the notif, not the id of the post)
    assert(n.t && n.html, 't and html props should be set');
    assert.strictEqual(n.type, 'Snp');
    assert.strictEqual(n.lastAuthor.id, p.uId);
    assert.strictEqual(n.img, n.track.img);
    assert(
      n.track.img.indexOf(p.plId) > -1,
      'track.img should include the plId',
    );
    assert(n.href.indexOf(plUri) > -1, 'href should include the plUri');
  });
});
