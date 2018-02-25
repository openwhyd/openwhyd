// inspired by https://www.algolia.com/doc/tutorials/indexing/exporting/how-to-export-data-of-an-index-to-a-file/

const algoliasearch = require('algoliasearch');

const forEachRecord = ({ indexName, appId, apiKey }, recordHandler) =>
  new Promise((resolve, reject) => {
    const client = algoliasearch(appId, apiKey);
    const index = client.initIndex(indexName);
    const browser = index.browseAll();
    browser.on('result', content =>
      content.hits.forEach(hit => recordHandler(hit))
    );
    browser.on('end', () => {
      resolve();
    });
    browser.on('error', err => {
      reject(err);
    });
  });

// main script

const makeSetFromIndex = ({ indexName, appId, apiKey }) => new Promise((resolve) => {
  const set = new Set();
  forEachRecord({ indexName, appId, apiKey }, hit => set.add(hit.objectID))
    .then(() => resolve(set));
});

module.exports = {
  forEachRecord,
  makeSetFromIndex,
};
