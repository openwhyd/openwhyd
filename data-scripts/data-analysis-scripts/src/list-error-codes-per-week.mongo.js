// usage: $ mongo openwhyd_dump list-error-codes-per-week.mongo.js

load('./mongo-helpers/date-range.mongo.js'); // exports makeDateRangeQuery()
load('./mongo-helpers/period-aggregator.mongo.js'); // exports makeMapWith()

const OUTPUT_COLLECTION = 'list-error-codes-per-week';
const FROM_DATE = new Date(today - YEAR); // last 365 days

// notice: MongoDB will not call the reduce function for a key that has only a single value
const map = makeMapWith(renderWeek, function mapTemplate() {
  //var failed = this.err ? 1 : 0;
  var val = { total: 1 }; //, total_err: failed
  var error = this.err ? this.err.code || this.err.error || this.err.data : undefined;
  if (error !== undefined) val[error] = 1;
  emit(renderWeek(this._id.getTimestamp()), val); // group error counts by week
});

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  // sum counts for each week
  vals.forEach(val => Object.keys(val).forEach(key => finalVal[key] = (finalVal[key] || 0) + val[key]));
  return finalVal;
}

var opts = {
  finalize: function(key, reduced) {
    // list of player ids from https://github.com/openwhyd/openwhyd/blob/d27fb71220cbd29e9e418bd767426e3b4a2187f3/whydJS/public/js/whydPlayer.js#L559
    Object.keys(reduced)
      .filter(key => key !== 'total')
      .forEach(error => {
        reduced[error] = reduced[error] / reduced.total; // compute % of errors againt plays
      });
      delete reduced.total;
    return reduced;
  },
  out: {
    'replace': OUTPUT_COLLECTION, // will store results in that collection
    // => took 8 minutes to run
  },
  query: makeDateRangeQuery(FROM_DATE),
  //limit: 100000 // => runs in less time
};

print('generating data, date:' + new Date());
var result = db.playlog.mapReduce(map, reduce, opts);
print('⏲  ' + Math.round(result.timeMillis / 1000) + ' seconds');
print('=> results on stored in db collection: ' + OUTPUT_COLLECTION);
//printjson(db[OUTPUT_COLLECTION].find().toArray());
