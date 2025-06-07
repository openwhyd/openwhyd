/**
 * The goal of this script is to reindex just the missing objects to Algolia Search.
 * WIP: Just able to dry-run the diff on the "posts" and "users" collections.
 */

require('dotenv').config();
const confirm = require('node-ask').confirm;
const algoliaUtils = require('./algolia-utils.js');
const mongo = require('./mongodb-wrapper.js');

// constants

const MONGODB_PARAMS = {}; //{ mongoDbPort: 27117 }; // can be used to override environment variables

if (process.env['ALGOLIA_APP_ID'] === undefined)
  throw new Error(`missing env var: ALGOLIA_APP_ID`);
if (process.env['ALGOLIA_API_KEY'] === undefined)
  throw new Error(`missing env var: ALGOLIA_API_KEY`);

const appId = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_API_KEY;

const COLLECTIONS = [
  {
    name: 'user',
    indexName: 'users',
    objTransform: (dbObj) => ({
      objectID: dbObj._id.toString(),
      name: dbObj.name,
      username: dbObj.username,
      img: dbObj.img,
    }),
  },
  // TODO: run on the "post" collection next
  /*
  {
    name: 'post',
    indexName: 'posts',
    objTransform: dbObj => ({
      objectID: dbObj._id.toString(),
      name: dbObj.name,
      uId: dbObj.uId,
      eId: dbObj.eId,
      pl: dbObj.pl,
      text: dbObj.text
    })
  }
  */
  // TODO: also add "playlists"
];

// misc. helpers

const bindCollectionToDB = (db) => (coll) =>
  Object.assign({}, coll, {
    coll: db.collection(coll.name),
  });

// to run a list of functions (promise factories) one after another
const runSeq = (functions) =>
  functions.reduce((p, fct) => p.then(fct), Promise.resolve());

const getCollCounts = ({ name, coll }) =>
  new Promise((resolve, reject) =>
    coll.countDocuments((err, count) =>
      err ? reject(err) : resolve({ name, count }),
    ),
  );

const getIndexCounts = ({ indexName }) =>
  algoliaUtils
    .getIndex({ appId, apiKey, indexName })
    .search('')
    .then(({ nbHits }) => ({ name: indexName, count: nbHits }));

const renderResults = (diffIndexer) =>
  `skipped ${diffIndexer.nbSkipped} / ${diffIndexer.nbConsidered} objects`;

// dry run

const dryRunIndexer = (obj) => console.log(`  would index ${obj._id}`);

// diff logic

class DiffIndexer {
  constructor({ alreadyIndexed, missingObjectHandler }) {
    this.alreadyIndexed = alreadyIndexed || new Set();
    this.missingObjectHandler = missingObjectHandler;
    this.nbConsidered = 0;
    this.nbSkipped = 0;
  }
  consider(obj) {
    ++this.nbConsidered;
    console.log('consider', obj, this.alreadyIndexed.has(obj._id.toString()));
    if (!this.alreadyIndexed.has(obj._id.toString())) {
      this.missingObjectHandler(obj);
    } else {
      ++this.nbSkipped;
    }
  }
}

const indexMissingObjects = ({ coll, indexName, missingObjectHandler }) =>
  new Promise((resolve) => {
    algoliaUtils
      .makeSetFromIndex({ appId, apiKey, indexName })
      .then((alreadyIndexed) => {
        const diffIndexer = new DiffIndexer({
          alreadyIndexed,
          missingObjectHandler,
        });
        mongo
          .forEachObject(coll, (obj) => diffIndexer.consider(obj), { _id: 1 })
          .then(() => resolve(diffIndexer));
      });
  });

const reindexAndDisplay = (collection, indexer = dryRunIndexer) => {
  console.log(`- collection: ${collection.name} ...`);
  return indexMissingObjects(
    Object.assign({ missingObjectHandler: indexer }, collection),
  ).then((diffIndexer) => console.log('  =>', renderResults(diffIndexer)));
};

// main script

let cols;

// steps

const init = () =>
  mongo
    .init(MONGODB_PARAMS)
    .then((db) => (cols = COLLECTIONS.map(bindCollectionToDB(db))));

const displayCounts = () =>
  Promise.all(cols.map(getCollCounts)).then((results) => {
    console.log('___\nindexable collections:');
    results.forEach((result) =>
      console.log(`- ${result.name} (${result.count} objects)`),
    );
  });

const displayIndexCounts = () =>
  Promise.all(cols.map(getIndexCounts)).then((results) => {
    console.log('___\ncurrent indexes:');
    results.forEach((result) =>
      console.log(`- ${result.name} (${result.count} objects)`),
    );
  });

const dryRun = () => {
  console.log('___\ndry run:');
  return runSeq(cols.map((coll) => () => reindexAndDisplay(coll)));
};

const askConfirmation = () =>
  confirm(
    '___\nstart the actual reindexing of this collection now? [y|N] ',
  ).then((res) => !res && process.exit(0));

const reindex = () => {
  console.log('___\nreindexing:');
  return runSeq(
    cols.map((coll) => {
      const index = algoliaUtils.getIndex({
        appId,
        apiKey,
        indexName: coll.indexName,
      });
      const batcher = new algoliaUtils.BatchedAlgoliaIndexer({ index });
      const processObject = (dbObj) =>
        batcher.addObject(coll.objTransform(dbObj));
      return () =>
        reindexAndDisplay(coll, processObject).then(() => batcher.flush());
    }),
  );
};

const end = () => {
  console.log('\nend.');
  process.exit(0);
  // TODO: display index counts
};

const syncNowSteps = [init, reindex];

const dryRunSteps = [init, displayIndexCounts, displayCounts, dryRun];

const defaultSteps = dryRunSteps.concat([askConfirmation, reindex]);

let steps = defaultSteps;

switch (process.argv[2]) {
  case null:
    console.warn(
      'no parameter => will dry run and ask for confirmation before reindexing',
    );
  case 'dry-run' /* eslint-disable-line no-fallthrough */:
    console.warn(
      'dry-run mode => will dry run and exit without updating indexes',
    );
    steps = dryRunSteps;
    break;
  case 'sync-now':
    console.warn(
      'sync-now mode => will update algolia index without asking for confirmation',
    );
    steps = syncNowSteps;
    break;
  default:
    console.warn('invalid parameter');
    console.warn('usage:');
    console.warn('  node run-diff-reindex.js');
    console.warn('  node run-diff-reindex.js dry-run');
    console.warn('  node run-diff-reindex.js sync-now');
    process.exit(1);
}

runSeq(steps.concat([end]));
