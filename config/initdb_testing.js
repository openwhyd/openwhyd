// Usage: this file should be run by runShellScript() or by mongo's CLI:
// $ mongo openwhyd_data initdb_testing.js

//db = db.getSiblingDB("openwhyd_data"); //connect("localhost:27017/whyd_music");

print('upserting openwhyd testing users ...');

db.user.update(
  { _id: ObjectId('000000000000000000000001') },
  {
    $set: {
      email: 'test@openwhyd.org',
      handle: 'admin',
      name: 'admin',
      img:
        '/images/blank_user.gif' /* needed for "has default avatar" e2e test */,
      pwd: '21232f297a57a5a743894a0e4a801fc3' /* password = "admin" */,
      'consent.lang': 'en'
    },
    $currentDate: {
      'consent.date': true // => mongodb will store a ISODate in consent.date
    }
  },
  { upsert: true }
);

db.user.update(
  { _id: ObjectId('000000000000000000000002') },
  {
    $set: {
      email: 'dummy@openwhyd.org',
      handle: 'dummy',
      name: 'dummy',
      img: '/images/blank_user.gif',
      pwd: '21232f297a57a5a743894a0e4a801fc3' /* password = "admin" */
    }
  },
  { upsert: true }
);

print('upserting openwhyd testing posts ...');

db.post.update(
  { _id: ObjectId(`0`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #0`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`1`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #1`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`2`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #2`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`3`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #3`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`4`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #4`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`5`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #5`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`6`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #6`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`7`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #7`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`8`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #8`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`9`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #9`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`10`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #10`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`11`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #11`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`12`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #12`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`13`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #13`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`14`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #14`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`15`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #15`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`16`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #16`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`17`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #17`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`18`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #18`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`19`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #19`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

db.post.update(
  { _id: ObjectId(`20`.padStart(24, '0')) },
  {
    $set: {
      name: `Fake track #20`,
      eId: '/yt/Wch3gJG2GJ4' /* 1-second video, from YouTube */,
      uId: '000000000000000000000002' /* user id of dummy user defined above */,
      uNm: 'dummy',
      img: '/images/cover-track.png'
    }
  },
  { upsert: true }
);

print('done! :-)');
