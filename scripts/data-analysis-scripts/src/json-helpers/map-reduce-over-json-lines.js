const snip = require('../../../../whydJS/app/snip.js')

const emit = (key, value) => ({ key, value });

// equivalent to db.<collection>.mapReduce(map, reduce, opts);
const mapReduceFromJsonLines = (filePath, map, reduce, opts) => new Promise((resolve, reject) => {
  let reduced = {};
  snip.forEachFileLine(filePath, function lineHandler(line) {
    if (typeof line === 'undefined') {
      // no more lines => finalize and output results
      Object.keys(reduced).forEach(key => reduced[key] = opts.finalize(key, reduced[key]));
      resolve(reduced);
    } else if (line) {
      const processed = map.call(JSON.parse(line));
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
  mapReduceFromJsonLines,
};
