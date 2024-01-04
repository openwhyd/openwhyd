// @ts-check

// Import tracks from a user into another openwhyd account.
//
// IMPORTANT:
// - the list of playlists of the destination user will be overwritten
//   => existing tracks (if any) on that profile may end up in old playlists.
// - on each imported track, the number of plays, reposts and likes will be reset to zero.
//
// Usage in production:
//   $ . env-vars-local.sh
//   $ node scripts/import-posts.js 5f0f0d701125f9d3afca1bcc 6591c8dd0890c870388d2508 # imports all posts from https://openwhyd.org/u/5f0f0d701125f9d3afca1bcc

const assert = require('node:assert');
const request = require('request');
const mongodb = require('mongodb');

const ObjectId = (id) => new mongodb.ObjectId(id);

// Parameters
const fromUserId = process.argv[2];
const toUserId = process.argv[3];
assert.ok(
  fromUserId && toUserId,
  'Usage: $ node scripts/import-posts.js <from_user_id> <to_user_id>',
);

// Environment
const {
  URL_PREFIX,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_DATABASE,
  MONGODB_USER,
  MONGODB_PASS,
} = process.env;
const authStr =
  MONGODB_USER && MONGODB_PASS
    ? encodeURIComponent(MONGODB_USER) +
      ':' +
      encodeURIComponent(MONGODB_PASS) +
      '@'
    : '';
const url = `mongodb://${authStr}${MONGODB_HOST}:${MONGODB_PORT}`;
const dbName = MONGODB_DATABASE;

const connectToDb = ({ url, dbName }) => {
  const client = new mongodb.MongoClient(url);
  return { db: client.db(dbName), client };
};

const fetchUserProfile = ({ userId }) =>
  new Promise((resolve, reject) => {
    const url = `${URL_PREFIX}/api/user/${userId}?format=json`;
    console.warn(`fetching profile from ${url} ...`);
    request(url, (err, _, body) =>
      err ? reject(err) : resolve(JSON.parse(body)),
    );
  });

const updateUser = ({ db, user }) => {
  const { _id, ...userData } = user;
  return db
    .collection('user')
    .updateOne({ _id: ObjectId(_id) }, { $set: { ...userData } });
};

/** Returns list of posts, from most recent to oldest */
const fetchUserPosts = ({ userId }) =>
  new Promise((resolve, reject) => {
    const limit = 99999999;
    const url = `${URL_PREFIX}/u/${userId}?format=json&limit=${limit}`;
    console.warn(`fetching posts from ${url} ...`);
    request(url, (err, _, body) =>
      err
        ? reject(err)
        : resolve({
            posts: JSON.parse(body),
          }),
    );
  });

const insertPosts = ({ db, posts, postOverrides }) => {
  const postsToImport = posts
    .reverse() // _id will be regenerated chronologically => sort posts from oldest to most recent
    .map(({ _id, ...post }) => ({
      ...post,
      nbP: 0,
      nbR: 0,
      lov: [],
      ...postOverrides, // may include uId and uNm
    }));
  return db.collection('post').insertMany(postsToImport);
};

(async () => {
  console.warn(`connecting to ${MONGODB_HOST}:${MONGODB_PORT}/${dbName} ...`);
  const { db, client } = await connectToDb({ url, dbName });
  const { pl } = await fetchUserProfile({ userId: fromUserId });
  const { name: toUserName } = await fetchUserProfile({ userId: toUserId });
  console.warn(
    `about to import posts of ${pl.length} playlists, from user ${fromUserId} to ${toUserId} (${toUserName})`,
  );
  await new Promise((resolve) => setTimeout(resolve, 5000)); // give user some time to Ctrl-C
  await updateUser({ db, user: { _id: toUserId, pl } });
  const { posts } = await fetchUserPosts({ userId: fromUserId });
  console.warn(`inserting ${posts.length} posts...`);
  await insertPosts({
    db,
    posts,
    postOverrides: { uId: toUserId, uNm: toUserName },
  });
  client.close();
  console.warn(`✅ ${posts.length} posts imported to ${toUserId}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
