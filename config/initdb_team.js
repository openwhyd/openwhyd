// Usage: this file should be run by mongo's CLI:
// $ mongo openwhyd_data whydDB/initdb_team.js

//db = db.getSiblingDB("openwhyd_data"); //connect("localhost:27017/whyd_music");

print('upserting openwhyd team users ...');

db.user.update(
  { _id: ObjectId('000000000000000000000001') },
  {
    $set: {
      email: 'test@openwhyd.org',
      handle: 'admin',
      name: 'admin',
      img:
        '/images/blank_user.gif' /* needed for "has default avatar" e2e test */,
      pwd: '21232f297a57a5a743894a0e4a801fc3' /* password = "admin" */
    }
  },
  { upsert: true }
);

print('done! :-)');
