/* globals db */

// Usage: this file should be run by mongo's CLI:
// $ mongo openwhyd_data whydDB/initdb.js

//print("connecting to openwhyd_data database...");
//db = db.getSiblingDB("openwhyd_data"); //connect("localhost:27017/whyd_music");

print('creating openwhyd collections...');
db.createCollection('config');
db.createCollection('email');
db.createCollection('invite');
db.createCollection('notif');
db.createCollection('user');
db.createCollection('follow');
db.createCollection('post');
db.createCollection('activity');
db.createCollection('track');
db.createCollection('comment');

// print('indexing post collection...');
db.post.createIndex({ uId: 1 });
db.post.createIndex({ uId: 1, 'pl.id': 1 }, { sparse: true });
db.post.createIndex({ 'pl.id': 1 }, { sparse: true });
db.post.createIndex({ order: 1 }, { sparse: true });
db.post.createIndex({ eId: 1 });
db.post.createIndex({ lov: 1 }, { sparse: true });
db.post.createIndex({ 'repost.pId': 1 }, { sparse: true });
db.post.createIndex({ 'repost.uId': 1 }, { sparse: true });

// print('indexing follow collection...');
db.follow.createIndex({ uId: 1 });
db.follow.createIndex({ tId: 1 });

// print('indexing user collection...');
db.user.createIndex({ email: 1 });
db.user.createIndex({ handle: 1 }, { sparse: true });
db.user.createIndex({ fbId: 1 }, { sparse: true });
db.user.createIndex({ n: 1 }, { sparse: true });
db.user.createIndex({ 'pref.pendEN': 1 }, { sparse: true });
db.user.createIndex({ 'pref.nextEN': 1 }, { sparse: true });
db.user.createIndex({ 'sp.id': 1 }, { sparse: true }); // spotify id

// print('removing legacy fields on user collection...');
db.user.dropIndex({ apTok: 1 });
db.user.updateMany({}, { $unset: { apTok: 1 } });

// print('indexing activity collection...');
db.activity.createIndex({ id: 1 }, { sparse: true }); /*poster.id*/
db.activity.createIndex({ 'like.id': 1 }, { sparse: true });
db.activity.createIndex({ 'like.pId': 1 }, { sparse: true });

// print('indexing track collection...');
db.track.createIndex({ eId: 1 });
db.track.createIndex({ score: 1 });

// print('indexing comment collection...');
db.comment.createIndex({ pId: 1 });

// print('indexing notif collection...');
db.notif.createIndex({ uId: 1 });

print('done! :-)');
