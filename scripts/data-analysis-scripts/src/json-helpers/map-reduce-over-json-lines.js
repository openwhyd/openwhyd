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
  let ignoreTheRest = false;
  let reduced = {};
  const limitReached = !opts.limit ? () => false : ((remaining = opts.limit) => () => remaining-- <= 0)();
  const inTimeRange = !opts.query ? () => true : object => {
    const date = dateFromObject(object);
    return date && date > opts.query._id.$gt && date < opts.query._id.$lt;
  };
  function finalizeAndResolve() {
    if (opts.finalize) {
      Object.keys(reduced).forEach(key => reduced[key] = opts.finalize(key, reduced[key]));
    }
    if ((opts.out || {}).replace) {
      console.error('ℹ️  opts.out.replace is not supported => printing resulting collection to stdout');
      console.log(JSON.stringify(reduced, null, 2));
    }
    resolve(reduced);
  }
  snip.forEachFileLine(filePath, function lineHandler(line) {
    if (ignoreTheRest) {
      // do nothing
    } else if (line === undefined || limitReached()) {
      // no more lines
      ignoreTheRest = true;
      finalizeAndResolve();
    } else if (line) {
      let json;
      try {
        json = JSON.parse(line);
      } catch(err) {
        console.error('Parse Error:', err.message, 'at', line, '=> skipping line');
        return;
      }
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
