// Import tracks from a user profile on openwhyd.org, to the local test db.
//
// Usage:
//   $ make docker-seed                          # clears the database and creates the admin user
//   $ node scripts/import-from-prod.js adrien 5 # imports 5 posts from https://openwhyd.org/adrien
//   $ node scripts/import-from-prod.js u/5911f8e098267ba4b34b8424 # ... or specify a user by id

const request = require('request');
const mongodb = require('mongodb');

const ObjectId = (id) => mongodb.ObjectId(id);

// Parameters
const { MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE } = process.env;
const url = `mongodb://${MONGODB_HOST || 'localhost'}:${MONGODB_PORT || 27117}`;
const dbName = MONGODB_DATABASE || 'openwhyd_test';
const username = process.argv[2] || 'test'; // default profile: https://openwhyd.org/test
const password = {
  plain: 'admin',
  md5: '21232f297a57a5a743894a0e4a801fc3',
};
const nbPosts = process.argv[3] ? parseInt(process.argv[3]) : 21;
const importSubscribers = false;

const connectToDb = ({ url, dbName }) => {
  const client = new mongodb.MongoClient(url);
  return { db: client.db(dbName), client };
};

const fetchUserProfile = ({ username }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/api/user/${username}?format=json`;
    console.log(`fetching profile from ${url} ...`);
    request(url, (err, _, body) =>
      err ? reject(err) : resolve(JSON.parse(body)),
    );
  });

const fetchUserPosts = ({ username }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/${username}?format=json&limit=${nbPosts}`;
    console.log(`fetching tracks from ${url} ...`);
    request(url, (err, _, body) =>
      err
        ? reject(err)
        : resolve({
            posts: JSON.parse(body).map((post) => ({
              ...post,
              _id: ObjectId(post._id),
            })),
          }),
    );
  });

const fetchSubscribers = ({ userId }) =>
  new Promise((resolve, reject) => {
    const url = `https://openwhyd.org/api/user/${userId}/subscribers`;
    console.log(`fetching ${url} ...`);
    request(url, (err, _, body) =>
      err ? reject(err) : resolve({ subscribers: JSON.parse(body) }),
    );
  });

const upsertUser = ({ db, user }) =>
  new Promise((resolve, reject) => {
    const { _id, ...userData } = user;
    db.collection('user').updateOne(
      { _id: ObjectId(_id) },
      { $set: { ...userData, pwd: password.md5 } },
      { upsert: true },
      (err) => (err ? reject(err) : resolve()),
    );
  });

const insertPosts = ({ db, posts }) =>
  new Promise((resolve, reject) => {
    db.collection('post').insertMany(posts, (err) =>
      err ? reject(err) : resolve(),
    );
  });

const insertSubscribers = async ({ db, userId, subscribers }) => {
  db.collection('follow').insertMany(
    subscribers.map((subscriber) => ({
      uId: subscriber.id,
      uNm: subscriber.name,
      tId: userId,
      tNm: userId,
    })),
  );
  await db.collection('user').insertMany(
    subscribers
      .filter((subscriber) => subscriber.id !== userId) // to prevent E11000 duplicate key error
      .map((subscriber) => ({
        _id: ObjectId(subscriber.id),
        name: subscriber.name,
      })),
  );
};

(async () => {
  console.log(`connecting to ${url}/${dbName} ...`);
  const { db, client } = await connectToDb({ url, dbName });
  const user = await fetchUserProfile({ username });
  await upsertUser({ db, user });
  const userId = '' + user._id;
  const { posts } = await fetchUserPosts({ username }); // or require(`./../${username}.json`);
  console.log(`imported ${posts.length} posts`);
  await insertPosts({ db, posts });
  if (importSubscribers) {
    const { subscribers } = await fetchSubscribers({ userId });
    console.log(`imported ${subscribers.length} subscribers`);
    await insertSubscribers({ db, userId, subscribers });
  }
  // refresh openwhyd's in-memory cache of users, to allow this user to login
  await new Promise((resolve, reject) =>
    request.post('http://localhost:8080/testing/refresh', (err) =>
      err ? reject(err) : resolve(),
    ),
  );
  client.close();
  console.log(`inserted user => http://localhost:8080/${username}`);
  console.log(`login id: ${username}, password: ${password.plain}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
