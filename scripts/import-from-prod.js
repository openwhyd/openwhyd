// Import tracks from a user profile on openwhyd.org, to the local test db.
//
// Usage:
//   $ npm run docker:seed  # will clear the database and create the admin user
//   $ node scripts/import-from-prod.js adrien
//   # ... will import 21 posts from https://openwhyd.org/adrien

const request = require('request');
const mongodb = require('mongodb');

const ObjectID = (id) => mongodb.ObjectID.createFromHexString(id);

// Parameters
const url = 'mongodb://localhost:27117';
const dbName = 'openwhyd_test';
const username = process.env[2] || 'test'; // default profile: https://openwhyd.org/test

const connectToDb = ({ url, dbName }) =>
  new Promise((resolve, reject) =>
    mongodb.MongoClient.connect(url, (err, client) => {
      if (err) reject(err);
      else resolve({ db: client.db(dbName), client });
    })
  );

const fetchUserData = ({ username }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/${username}?format=json`;
    console.log(`fetching tracks from ${url} ...`);
    request(url, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve({
          posts: JSON.parse(body).map((post) => ({
            ...post,
            _id: ObjectID(post._id),
          })),
        });
      }
    });
  });

function genUserFromPost({ post }) {
  return {
    _id: ObjectID(post.uId),
    id: post.uId,
    name: post.uNm,
  };
}

const insertUser = ({ db, user }) =>
  new Promise((resolve, reject) => {
    db.collection('user').insertOne(user, function (err, r) {
      if (err) reject(err);
      else resolve();
    });
  });

const insertPosts = ({ db, posts }) =>
  new Promise((resolve, reject) => {
    db.collection('post').insertMany(posts, function (err, r) {
      if (err) reject(err);
      else resolve();
    });
  });

(async () => {
  console.log(`connecting to ${url}/${dbName} ...`);
  const { db, client } = await connectToDb({ url, dbName });
  const { posts } = await fetchUserData({ username }); // or require(`./../${username}.json`);
  console.log(`imported ${posts.length} posts`);
  const user = genUserFromPost({ post: posts[0] });
  // console.log('genUserFromPost =>', user);
  // await insertUser({ db, user }); // may cause E11000 duplicate key error collection: openwhyd_test.user, after seeding the db
  console.log('inserted user');
  await insertPosts({ db, posts });
  client.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
