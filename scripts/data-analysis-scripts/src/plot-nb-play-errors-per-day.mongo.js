/* globals db, load, makeMapWith, emit, renderDate */

load('./mongo-helpers/period-aggregator.mongo.js'); // exports makeMapWith()

const OUTPUT_COLLECTION = 'plot-nb-play-errors-per-day';

// notice: MongoDB will not call the reduce function for a key that has only a single value
const map = makeMapWith(renderDate, function mapTemplate() {
  // => emit same kind of output as reduce()'s
  var failed = this.err ? 1 : 0;
  var val = { total: 1, total_err: failed };
  var getPlayerId = (/*eId*/) => (/^\/(\w\w)\//.exec(this.eId) || [])[1];
  var isUrl = (eId) => eId.substr(0, 8).indexOf('//') !== -1;
  var playerId = getPlayerId(this.eId) || (isUrl(this.eId) ? 'fi' : 'xx');
  val[playerId] = 1;
  val[playerId + '_err'] = failed;
  emit(renderDate(this._id.getTimestamp()), val);
});

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  vals.forEach((val) =>
    Object.keys(val).forEach(
      (key) => (finalVal[key] = (finalVal[key] || 0) + val[key])
    )
  );
  return finalVal;
}

var opts = {
  finalize: function (key, reduced) {
    // list of player ids from https://github.com/openwhyd/openwhyd/blob/d27fb71220cbd29e9e418bd767426e3b4a2187f3/public/js/whydPlayer.js#L559
    'total,yt,sc,dm,vi,dz,ja,bc,fi,sp,xx'.split(',').forEach((playerId) => {
      if (!reduced[playerId]) return;
      reduced[playerId] = reduced[playerId + '_err'] / reduced[playerId]; // compute % of errors
      delete reduced[playerId + '_err'];
    });
    return reduced;
  },
  out: {
    replace: OUTPUT_COLLECTION, // will store results in that collection
    // => took 11 minutes to run from db
  },
  //limit: 100000 // => runs in 2 seconds from db
  //limit: 1000000 // => runs in 25 seconds from db
};

db.playlog.mapReduce(map, reduce, opts);
