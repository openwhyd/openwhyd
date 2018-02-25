/**
 * The goal of this script is to reindex just the missing objects to Algolia Search.
 * WIP: Just able to dry-run the diff on the "posts" and "users" collections.
 */

require('dotenv').config({path: '../../whydJS/env-vars-perso.sh'});
const algoliaUtils = require('./algolia-utils.js');
const mongo = require('./mongodb-wrapper.js');

const appId = process.env.ALGOLIA_APP_ID.substr();
const apiKey = process.env.ALGOLIA_API_KEY.substr();

// misc. helpers

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

const makeReindexPromise = (collection, indexer = dryRunIndexer) => () => {
  console.log(`- collection: ${collection.name} ...`);
  return indexMissingObjects(Object.assign({ missingObjectHandler: indexer }, collection))
    .then(diffIndexer => console.log('  =>', renderResults(diffIndexer)))
};
  
// main script

mongo.init({ mongoDbPort: 27117 }).then(db => {

  const cols = [
    { name: 'user', coll: db.collections.user, indexName: 'users' },
    { name: 'post', coll: db.collections.post, indexName: 'posts' },
  ];

  Promise.all(cols.map(getCounts)).then(results => {

    console.log('___\nindexable collections:');
    results.forEach(result => console.log(`- ${result.name} (${result.count} objects)`));

    console.log('___\ndry run:');
    cols.reduce((p, coll) => p.then(makeReindexPromise(coll)), Promise.resolve())
      .then(() => console.log('\ndone.'));

  });
});
