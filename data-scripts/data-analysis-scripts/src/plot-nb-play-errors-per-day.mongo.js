const OUTPUT_COLLECTION = 'plot-nb-play-errors-per-day';

function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  var failed = this.err ? 1 : 0;
  var val = { total: 1, total_err: failed };
  var playerId = this.eId.substr(1, 2);
  val[playerId] = 1;
  val[playerId + '_err'] = failed;
  emit(renderDate(this._id.getTimestamp()), val);
}

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  vals.forEach(val => Object.keys(val).forEach(key => finalVal[key] = (finalVal[key] || 0) + val[key]));
  return finalVal;
}

var opts = {
  finalize: function(key, reduced) {
    // list of player ids from https://github.com/openwhyd/openwhyd/blob/d27fb71220cbd29e9e418bd767426e3b4a2187f3/whydJS/public/js/whydPlayer.js#L559
    'total,yt,sc,dm,vi,dz,ja,bc,fi,sp'.split(',').forEach(playerId => {
      if (!reduced[playerId]) return;
      reduced[playerId] = reduced[playerId + '_err'] / reduced[playerId]; // compute % of errors
      delete reduced[playerId + '_err'];
    });
    return reduced;
  },
  out: {
    'replace': OUTPUT_COLLECTION, // will store results in that collection
    // => took 11 minutes to run
  },
  //limit: 100000 // => runs in 2 seconds
  //limit: 1000000 // => runs in 25 seconds
};

db.playlog.mapReduce(map, reduce, opts);
