/**
 * The goal of this script is to reindex just the missing objects to Algolia Search.
 * WIP: Just able to dry-run the diff on the "posts" and "users" collections.
 */

require('dotenv').config({path: '../../whydJS/env-vars-perso.sh'});
const confirm = require('node-ask').confirm;
const algoliaUtils = require('./algolia-utils.js');
const mongo = require('./mongodb-wrapper.js');

// constants

const appId = process.env.ALGOLIA_APP_ID.substr();
const apiKey = process.env.ALGOLIA_API_KEY.substr();

const COLLECTIONS = [
  {
    name: 'user',
    indexName: 'users',
    objTransform: (dbObj) => ({
      objectID: dbObj._id.toString(),
      name: dbObj.name,
    }),
  },
  {
    name: 'post',
    indexName: 'posts',
    objTransform: (dbObj) => ({
      objectID: dbObj._id.toString(),
      name: dbObj.name,
      uId: dbObj.uId,
      eId: dbObj.eId,
      pl: dbObj.pl,
      text: dbObj.text,
    }),
  },
]

// misc. helpers

const bindCollectionToDB = db => coll => Object.assign({}, coll, {
  coll: db.collections[coll.name]
});

// to run a list of functions (promise factories) one after another
const runSeq = functions => functions.reduce((p, fct) => p.then(fct), Promise.resolve());

const getCounts = ({ name, coll, indexName }) => new Promise((resolve, reject) =>
  coll.count((err, count) => err ? reject(err) : resolve({ name, count })));

const renderResults = diffIndexer =>
`skipped ${diffIndexer.nbSkipped} / ${diffIndexer.nbConsidered} objects`;

// dry run

const dryRunIndexer = obj => console.log(`  would index ${obj._id}`);

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
    if (!this.alreadyIndexed.has(obj._id.toString())) {
      this.missingObjectHandler(obj);
    } else {
      ++this.nbSkipped;
    }
  }
}

const indexMissingObjects = ({ coll, indexName, missingObjectHandler }) =>
  new Promise((resolve, reject) => {
    algoliaUtils.makeSetFromIndex({ appId, apiKey, indexName }).then(alreadyIndexed => {
      const diffIndexer = new DiffIndexer({ alreadyIndexed, missingObjectHandler });
      mongo.forEachObject(coll, obj => diffIndexer.consider(obj))
        .then(() => resolve(diffIndexer));
    });
  });

const reindexAndDisplay = (collection, indexer = dryRunIndexer) => {
  console.log(`- collection: ${collection.name} ...`);
  return indexMissingObjects(Object.assign({ missingObjectHandler: indexer }, collection))
    .then(diffIndexer => console.log('  =>', renderResults(diffIndexer)))
};
  
// main script

let cols;

const steps = [

  // step 1: init mongodb
  () => mongo.init({ mongoDbPort: 27117 }).then(db =>
    cols = COLLECTIONS.map(bindCollectionToDB(db))
  ),

  // step 2: display counts
  () => Promise.all(cols.map(getCounts)).then(results => {
    console.log('___\nindexable collections:');
    results.forEach(result => console.log(`- ${result.name} (${result.count} objects)`));
  }),

  // step 3: dry run
  () => {
    console.log('___\ndry run:');
    return runSeq(cols.map(coll => () => reindexAndDisplay(coll)));
  },

  // step 4: ask for confirmation
  () => confirm('___\nstart the actual reindexing of this collection now? [y|N] ')
    .then(res => !res && process.exit(0)),

  // step 5: proceed with reindexing
  () => {
    console.log('___\nreindexing:');
    return runSeq(cols.map(coll => {
      const index = algoliaUtils.getIndex({ appId, apiKey, indexName: coll.indexName });
      const batcher = new algoliaUtils.BatchedAlgoliaIndexer({ index });
      const processObject = dbObj => batcher.addObject(coll.objTransform(dbObj))
      return () => reindexAndDisplay(coll, processObject).then(() => batcher.flush());
    }));
  },

  // step 6: end
  () => {
    console.log('\nend.');
    // TODO: display index counts
  },
  
];

// run steps in sequence
runSeq(steps);
