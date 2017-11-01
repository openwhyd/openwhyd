// usage: $ mongo openwhyd_dump list-error-types-per-player.mongo.js

const OUTPUT_COLLECTION = 'list-error-types-per-player';

function map() {
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  if (!this.err) return;
  var val = { total: 1 };
  // consider URLs (starting with http or //) as `fi` (source: file)
  var playerId = this.eId[0] === '/' && this.eId[1] !== '/' ? this.eId.substr(1, 2) : 'fi';
  val[playerId] = 1;
  delete this.err.track; // in order to prevent `key too large to index`
  emit(JSON.stringify(this.err), val); // group by error object (contains source, code and message)
}

function reduce(day, vals) {
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
  out: {
    'replace': OUTPUT_COLLECTION, // will store results in that collection
    // => took 7 minutes to run
  },
  //limit: 1000000 // => runs in 5 seconds
};

var result = db.playlog.mapReduce(map, reduce, opts);
print('⏲  ' + Math.round(result.timeMillis / 1000) + ' seconds');
printjson(db[OUTPUT_COLLECTION].find().sort({ 'value.total': -1 }).toArray());
