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
const { MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE } = process.env;
const url = `mongodb://${MONGODB_HOST || 'localhost'}:${MONGODB_PORT || 27117}`;
const dbName = MONGODB_DATABASE || 'openwhyd_test';
const username = process.argv[2] || 'test'; // default profile: https://openwhyd.org/test
const password = {
  plain: 'admin',
  md5: '21232f297a57a5a743894a0e4a801fc3',
};

const connectToDb = ({ url, dbName }) =>
  new Promise((resolve, reject) =>
    mongodb.MongoClient.connect(url, (err, client) => {
      if (err) reject(err);
      else resolve({ db: client.db(dbName), client });
    })
  );

const fetchUserProfile = ({ username }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/api/user/${username}?format=json`;
    console.log(`fetching profile from ${url} ...`);
    request(url, (err, _, body) =>
      err ? reject(err) : resolve(JSON.parse(body))
    );
  });

const fetchUserData = ({ username }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/${username}?format=json`;
    console.log(`fetching tracks from ${url} ...`);
    request(url, (err, _, body) =>
      err
        ? reject(err)
        : resolve({
            posts: JSON.parse(body).map((post) => ({
              ...post,
              _id: ObjectID(post._id),
            })),
          })
    );
  });

const upsertUser = ({ db, user }) =>
  new Promise((resolve, reject) => {
    const { _id, ...userData } = user;
    db.collection('user').updateOne(
      { _id: ObjectID(_id) },
      { $set: { ...userData, pwd: password.md5 } },
      { upsert: true },
      (err) => (err ? reject(err) : resolve())
    );
  });

const insertPosts = ({ db, posts }) =>
  new Promise((resolve, reject) => {
    db.collection('post').insertMany(posts, (err) =>
      err ? reject(err) : resolve()
    );
  });

(async () => {
  console.log(`connecting to ${url}/${dbName} ...`);
  const { db, client } = await connectToDb({ url, dbName });
  const user = await fetchUserProfile({ username });
  await upsertUser({ db, user });
  const { posts } = await fetchUserData({ username }); // or require(`./../${username}.json`);
  console.log(`imported ${posts.length} posts`);
  await insertPosts({ db, posts });
  // refresh openwhyd's in-memory cache of users, to allow this user to login
  await new Promise((resolve, reject) =>
    request.post('http://localhost:8080/testing/refresh', (err) =>
      err ? reject(err) : resolve()
    )
  );
  client.close();
  console.log(`inserted user => http://localhost:8080/${username}`);
  console.log(`login id: ${username}, password: ${password.plain}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
