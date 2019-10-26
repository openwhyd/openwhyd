// You may want to clear the test database with `$ npm run docker-seed`
// before running this script.

const request = require('request');
const mongodb = require('mongodb');

const ObjectID = id => mongodb.ObjectID.createFromHexString(id);

// Parameters // TODO: get from command line arguments and/or env vars
const url = 'mongodb://localhost:27117';
const dbName = 'openwhyd_test';
const username = 'adrien';

const connectToDb = ({ url, dbName }) =>
  new Promise((resolve, reject) =>
    MongoClient.connect(
      url,
      (err, client) => {
        if (err) reject(err);
        else resolve({ db: client.db(dbName), client });
      }
    )
  );

const fetchUserData = ({ username }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/${username}?format=json`;
    console.log(`fetching tracks from ${url} ...`);
    request(url, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        resolve({
          posts: JSON.parse(body).map(post => ({
            ...post,
            _id: ObjectID(post._id)
          }))
        });
      }
    });
  });

function genUserFromPost({ post }) {
  return {
    _id: ObjectID(post.uId),
    id: post.uId,
    name: post.uNm
  };
}

const insertUser = ({ db, user }) =>
  new Promise((resolve, reject) => {
    db.collection('user').insertOne(user, function(err, r) {
      if (err) reject(err);
      else resolve();
    });
  });

const insertPosts = ({ db, posts }) =>
  new Promise((resolve, reject) => {
    db.collection('post').insertMany(posts, function(err, r) {
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
})().catch(err => {
  console.error(err);
  process.exit(1);
});
