// inspired by https://www.algolia.com/doc/tutorials/indexing/exporting/how-to-export-data-of-an-index-to-a-file/

const algoliasearch = require('algoliasearch');
const Progress = require('./Progress');

const getIndex = ({ indexName, appId, apiKey }) =>
  algoliasearch(appId, apiKey).initIndex(indexName);

const forEachRecord = async ({ indexName, appId, apiKey }, recordHandler) =>
  await getIndex({ indexName, appId, apiKey }).browseObjects({
    batch: (hits) => hits.forEach(recordHandler),
  });

const makeSetFromIndex = ({ indexName, appId, apiKey }) =>
  new Promise((resolve, reject) => {
    const set = new Set();
    const progress = new Progress({ label: 'fetching from algolia...' });
    forEachRecord({ indexName, appId, apiKey }, (hit) => {
      set.add(hit.objectID);
      progress.incr();
    })
      .then(() => {
        progress.done();
        resolve(set);
      })
      .catch((err) => {
        progress.done();
        /does not exist/.test(err.message) ? resolve(set) : reject(err);
      });
  });

class BatchedAlgoliaIndexer {
  constructor({ index, batchSize = 1000 }) {
    this.index = index;
    this.batchSize = batchSize;
    this.buffer = [];
  }
  // will send objects to Algolia until buffer is empty, then resolve
  flush() {
    const batch = this.buffer.splice(0, this.batchSize);
    console.log(`  (indexing ${batch.length} objects on algolia.com)`);
    return this.index
      .addObjects(batch)
      .then(() => (this.buffer.length > 0 ? this.flush() : Promise.resolve()));
  }
  // will accumulate objects in buffer and send when its size >= batchSize
  addObject(obj) {
    this.buffer.push(obj);
    return this.buffer.length >= this.batchSize
      ? this.flush()
      : Promise.resolve();
  }
}

module.exports = {
  getIndex,
  forEachRecord,
  makeSetFromIndex,
  BatchedAlgoliaIndexer,
};
