/* globals db */

// Usage: this file should be run by mongodb-shell-runner.js, on startup

//print("connecting to openwhyd_data database...");
//db = db.getSiblingDB("openwhyd_data"); //connect("localhost:27017/whyd_music");

const tolerateError = (name) => (err) => {
  if (!err.message.includes(name)) throw err;
};

print('creating openwhyd collections...');
await Promise.all([
  db.createCollection('config').catch(tolerateError('already exists')),
  db.createCollection('email').catch(tolerateError('already exists')),
  db.createCollection('invite').catch(tolerateError('already exists')),
  db.createCollection('notif').catch(tolerateError('already exists')),
  db.createCollection('user').catch(tolerateError('already exists')),
  db.createCollection('follow').catch(tolerateError('already exists')),
  db.createCollection('post').catch(tolerateError('already exists')),
  db.createCollection('activity').catch(tolerateError('already exists')),
  db.dropCollection('track').catch(tolerateError('ns not found')),
  db.createCollection('comment').catch(tolerateError('already exists')),
]);

print('indexing post collection...');
await db.collection('post').createIndex({ uId: 1 });
await db
  .collection('post')
  .createIndex({ uId: 1, 'pl.id': 1 }, { sparse: true });
await db.collection('post').createIndex({ 'pl.id': 1 }, { sparse: true });
await db.collection('post').createIndex({ order: 1 }, { sparse: true });
await db.collection('post').createIndex({ eId: 1 });
await db.collection('post').createIndex({ lov: 1 }, { sparse: true });
await db.collection('post').createIndex({ 'repost.pId': 1 }, { sparse: true });
await db.collection('post').createIndex({ 'repost.uId': 1 }, { sparse: true });

print('indexing follow collection...');
await db.collection('follow').createIndex({ uId: 1 });
await db.collection('follow').createIndex({ tId: 1 });

print('indexing user collection...');
await db.collection('user').createIndex({ email: 1 });
await db.collection('user').createIndex({ handle: 1 }, { sparse: true });
await db.collection('user').createIndex({ n: 1 }, { sparse: true });
await db.collection('user').createIndex({ 'pref.pendEN': 1 }, { sparse: true });
await db.collection('user').createIndex({ 'pref.nextEN': 1 }, { sparse: true });
await db.collection('user').createIndex({ 'sp.id': 1 }, { sparse: true }); // spotify id

print('removing legacy fields on user collection...');
await db
  .collection('user')
  .dropIndex({ fbId: 1 })
  .catch(tolerateError("can't find index"));
await db
  .collection('user')
  .dropIndex({ apTok: 1 })
  .catch(tolerateError("can't find index"));
await db.collection('user').updateMany({}, { $unset: { apTok: 1 } });

print('indexing activity collection...');
await db
  .collection('activity')
  .createIndex({ id: 1 }, { sparse: true }); /*poster.id*/
await db.collection('activity').createIndex({ 'like.id': 1 }, { sparse: true });
await db
  .collection('activity')
  .createIndex({ 'like.pId': 1 }, { sparse: true });

print('indexing comment collection...');
await db.collection('comment').createIndex({ pId: 1 });

print('indexing notif collection...');
await db.collection('notif').createIndex({ uId: 1 });

print('done! :-)');
