/* globals db, ObjectId */

// Usage: this file should be run by mongodb-shell-runner.js, on startup

//db = db.getSiblingDB("openwhyd_data"); //connect("localhost:27017/whyd_music");

print('upserting openwhyd testing users ...');

await db.collection('user').updateOne(
  { _id: ObjectId('000000000000000000000001') },
  {
    $set: {
      email: 'test@openwhyd.org',
      handle: 'admin',
      name: 'admin',
      img: '/images/blank_user.gif' /* needed for "has default avatar" e2e test */,
      pwd: '21232f297a57a5a743894a0e4a801fc3' /* password = "admin" */,
      'consent.lang': 'en',
    },
    $currentDate: {
      'consent.date': true, // => mongodb will store a ISODate in consent.date
    },
  },
  { upsert: true },
);

await db.collection('user').updateOne(
  { _id: ObjectId('000000000000000000000002') },
  {
    $set: {
      email: 'dummy@openwhyd.org',
      handle: 'dummy',
      name: 'dummy',
      img: '/images/blank_user.gif',
      pwd: '21232f297a57a5a743894a0e4a801fc3' /* password = "admin" */,
      'consent.lang': 'en',
    },
    $currentDate: {
      'consent.date': true, // => mongodb will store a ISODate in consent.date
    },
  },
  { upsert: true },
);

print('done! :-)');
