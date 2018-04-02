// usage: $ node list-error-types-per-player.js playlog.json.log

const { emit, mapReduceFromJsonLines } = require('./json-helpers/map-reduce-over-json-lines');

const INPUT_FILE = 'playlog.json.log'; // TODO: also support stdin (for shell-piping)

function map() {
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  if (!this.err) return;
  var val = { total: 1 };
  // consider URLs (starting with http or //) as `fi` (source: file)
  var playerId = this.eId[0] === '/' && this.eId[1] !== '/' ? this.eId.substr(1, 2) : 'fi';
  val[playerId] = 1;
  delete this.err.track; // in order to prevent `key too large to index`
  delete this.err.pId;
  delete this.err.trackUrl;
  return emit(JSON.stringify(this.err), val); // group by error object (contains source, code and message)
}

function reduce(errType, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  // sum counts for each player (and total)
  vals.forEach(val => Object.keys(val).forEach(key => finalVal[key] = (finalVal[key] || 0) + val[key]));
  return finalVal;
}

var opts = {
  finalize: function(key, reduced) {
    // list of player ids from https://github.com/openwhyd/openwhyd/blob/d27fb71220cbd29e9e418bd767426e3b4a2187f3/whydJS/public/js/whydPlayer.js#L559
    'yt,sc,dm,vi,dz,ja,bc,fi,sp'.split(',').forEach(playerId => {
      if (!reduced[playerId]) return;
      reduced[playerId] = reduced[playerId] / reduced.total; // compute % of errors
    });
    return reduced;
  },
};

(async () => {

  const startDate = new Date();
  console.warn(`Map-reducing ${INPUT_FILE} --> /dev/out ...`);
  const reduced = await mapReduceFromJsonLines(INPUT_FILE, map, reduce, opts);
  console.warn(`⏲  Duration: ${(new Date() - startDate) / 1000} seconds`); // => ~2 mn (instead of 7 from db)

  // equivalent to printjson(db[OUTPUT_COLLECTION].find().sort({ 'value.total': -1 }).toArray());
  var sorted = Object.keys(reduced)
    .map(_id => ({ _id, value: reduced[_id] }))
    .sort((a, b) => b.value.total - a.value.total);
  console.log(sorted);

})();
