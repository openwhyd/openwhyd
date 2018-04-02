const snip = require('../../../../whydJS/app/snip.js');

const emit = (key, value) => ({ key, value });

function dateFromObjectId (objectId) {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
}

// generate a Date from object._id.$oid or object._t (numeric timestamp)
function dateFromObject (object) {
  if (typeof object !== 'object') return;
  return (object._id || {}).$oid ? dateFromObjectId(object._id.$oid) : new Date(object._t);
}

const promoteObject = (object) => ({
  ...object,
  _id: {
    ...object._id,
    getTimestamp: () => dateFromObject(object),
  }
});

// equivalent to db.<collection>.mapReduce(map, reduce, opts);
const mapReduceFromJsonLines = (filePath, map, reduce, opts = {}) => new Promise((resolve, reject) => {
  let reduced = {};
  const inTimeRange = !opts.query ? () => true : object => {
    const date = dateFromObject(object);
    return date && date > opts.query._id.$gt && date < opts.query._id.$lt;
  };
  snip.forEachFileLine(filePath, function lineHandler(line) {
    if (typeof line === 'undefined') {
      // no more lines => finalize and output results
      Object.keys(reduced).forEach(key => reduced[key] = opts.finalize(key, reduced[key]));
      resolve(reduced);
    } else if (line) {
      const json = JSON.parse(line);
      const processed = inTimeRange(json) && map.call(promoteObject(json));
      if (processed) {
        const vals = []
          .concat(reduced[processed.key] ? [ reduced[processed.key] ] : [])
          .concat(processed.value);
        reduced[processed.key] = reduce(processed.key, vals);
      }
    }
  });
});

module.exports = {
  emit,
  dateFromObjectId,
  mapReduceFromJsonLines,
};
