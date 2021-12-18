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
db.post.ensureIndex({ uId: 1 });
db.post.ensureIndex({ uId: 1, 'pl.id': 1 }, { sparse: true });
db.post.ensureIndex({ 'pl.id': 1 }, { sparse: true });
db.post.ensureIndex({ order: 1 }, { sparse: true });
db.post.ensureIndex({ eId: 1 });
db.post.ensureIndex({ lov: 1 }, { sparse: true });
db.post.ensureIndex({ 'repost.pId': 1 }, { sparse: true });
db.post.ensureIndex({ 'repost.uId': 1 }, { sparse: true });

// print('indexing follow collection...');
db.follow.ensureIndex({ uId: 1 });
db.follow.ensureIndex({ tId: 1 });

// print('indexing user collection...');
db.user.ensureIndex({ email: 1 });
db.user.ensureIndex({ handle: 1 }, { sparse: true });
db.user.ensureIndex({ fbId: 1 }, { sparse: true });
db.user.ensureIndex({ apTok: 1 }, { sparse: true });
db.user.ensureIndex({ n: 1 }, { sparse: true });
db.user.ensureIndex({ 'pref.pendEN': 1 }, { sparse: true });
db.user.ensureIndex({ 'pref.nextEN': 1 }, { sparse: true });
db.user.ensureIndex({ 'sp.id': 1 }, { sparse: true }); // spotify id

// print('indexing activity collection...');
db.activity.ensureIndex({ id: 1 }, { sparse: true }); /*poster.id*/
db.activity.ensureIndex({ 'like.id': 1 }, { sparse: true });
db.activity.ensureIndex({ 'like.pId': 1 }, { sparse: true });

// print('indexing track collection...');
db.track.ensureIndex({ eId: 1 });
db.track.ensureIndex({ score: 1 });

// print('indexing comment collection...');
db.comment.ensureIndex({ pId: 1 });

// print('indexing notif collection...');
db.notif.ensureIndex({ uId: 1 });

print('done! :-)');
