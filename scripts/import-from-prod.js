// Import tracks from a user profile on openwhyd.org, to the local test db.
//
// Usage:
//   $ make docker-seed                          # clears the database and creates the admin user
//   $ node scripts/import-from-prod.js adrien 5 # imports 5 posts from https://openwhyd.org/adrien
//   $ node scripts/import-from-prod.js u/5911f8e098267ba4b34b8424 # ... or specify a user by id

const mongodb = require('mongodb');

const ObjectId = (id) => mongodb.ObjectId(id);

// Parameters
const { MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE } = process.env;
const url = `mongodb://${MONGODB_HOST || 'localhost'}:${MONGODB_PORT || 27117}`;
const dbName = MONGODB_DATABASE || 'openwhyd_test';
const userURI = process.argv[2] || 'test'; // default profile: https://openwhyd.org/test
const userHandleOrId = userURI.split('/').pop();
if (!/^[\w.-]+$/.test(userHandleOrId)) {
  throw new Error(`invalid user handle or id: ${userHandleOrId}`);
}
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

const OPENWHYD_URL = 'https://openwhyd.org';

const fetchUserProfile = async ({ userHandleOrId }) => {
  const url = `${OPENWHYD_URL}/api/user/${encodeURIComponent(userHandleOrId)}?format=json`;
  console.log(`fetching profile from ${url} ...`);
  return JSON.parse(await (await fetch(url)).text());
};

const fetchUserPosts = async ({ userId }) => {
  const url = `${OPENWHYD_URL}/u/${encodeURIComponent(userId)}?format=json&limit=${nbPosts}`;
  console.log(`fetching tracks from ${url} ...`);
  return {
    posts: JSON.parse(await (await fetch(url)).text()).map((post) => ({
      ...post,
      _id: ObjectId(post._id),
    })),
  };
};

const fetchSubscribers = async ({ userId }) => {
  const url = `${OPENWHYD_URL}/api/user/${encodeURIComponent(userId)}/subscribers`;
  console.log(`fetching ${url} ...`);
  return { subscribers: JSON.parse(await (await fetch(url)).text()) };
};

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
  const user = await fetchUserProfile({ userHandleOrId });
  await upsertUser({ db, user });
  const userId = '' + user._id;
  const { posts } = await fetchUserPosts({ userId }); // or require(`./../${username}.json`);
  console.log(`imported ${posts.length} posts`);
  await insertPosts({ db, posts });
  if (importSubscribers) {
    const { subscribers } = await fetchSubscribers({ userId });
    console.log(`imported ${subscribers.length} subscribers`);
    await insertSubscribers({ db, userId, subscribers });
  }
  // refresh openwhyd's in-memory cache of users, to allow this user to login
  await fetch('http://localhost:8080/testing/refresh', { method: 'POST' });
  client.close();
  console.log(`inserted user => http://localhost:8080/${userURI}`);
  console.log(`login id: ${userURI}, password: ${password.plain}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
