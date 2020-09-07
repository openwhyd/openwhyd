// usage: $ mongo openwhyd_dump --eval "const RENDER_FCT = renderDate, OUTPUT_COLLECTION = 'list-error-codes-per-day';" list-error-codes-per-period.mongo.js

load('./mongo-helpers/date-range.mongo.js'); // exports makeDateRangeQuery()
load('./mongo-helpers/period-aggregator.mongo.js'); // exports makeMapWith()

// symbols that should be provided at runtime:
// - OUTPUT_COLLECTION: name of the mongodb collection to store the results
// - RENDER_FCT: function that will be used to aggregate _ids, e.g. 'renderDate'
// - PERIOD: (optional) range in milliseconds from today, e.g. 'YEAR', 'MONTH'

try {
  PERIOD = eval(PERIOD);
} catch (e) {
  PERIOD = WEEK; // default value: 7 days
}

var renderFct = eval(RENDER_FCT); // => e.g. renderDate() or renderWeek()

// notice: MongoDB will not call the reduce function for a key that has only a single value
function mapTemplate() {
  //var failed = this.err ? 1 : 0;
  var val = { total: 1 }; //, total_err: failed
  var error = this.err
    ? this.err.code || this.err.error || this.err.data
    : undefined;
  if (error !== undefined) val[error] = 1;
  emit(renderFct(this._id.getTimestamp()), val); // group error counts by week
}

const map = makeMapWith(
  renderFct,
  mapTemplate.toString().replace('renderFct', RENDER_FCT)
);

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  // sum counts for each period
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
    Object.keys(reduced)
      .filter((key) => key !== 'total')
      .forEach((error) => {
        reduced[error] = reduced[error] / reduced.total; // compute % of errors againt plays
      });
    delete reduced.total;
    return reduced;
  },
  out: {
    replace: OUTPUT_COLLECTION, // will store results in that collection
    // => took 8 minutes to run
  },
  query: makeDateRangeQuery(new Date(today - PERIOD)),
  //limit: 100000 // => runs in less time
};

print('PERIOD: ' + PERIOD / (24 * 60 * 60 * 1000) + ' days');
print('RENDER_FCT: ' + RENDER_FCT);
print('generating data, date: ' + new Date());
var result = db.playlog.mapReduce(map, reduce, opts);
print('⏲  ' + Math.round(result.timeMillis / 1000) + ' seconds');
print('=> results on stored in db collection: ' + OUTPUT_COLLECTION);
//printjson(db[OUTPUT_COLLECTION].find().toArray());
