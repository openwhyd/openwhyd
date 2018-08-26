load('./mongo-helpers/period-aggregator.mongo.js'); // exports makeMapWith()

const OUTPUT_COLLECTION = 'plot-nb-plays-per-day';

// notice: MongoDB will not call the reduce function for a key that has only a single value
const map = makeMapWith(renderDate, function mapTemplate() {
  var val = { total: 1 };
  var getPlayerId = eId => (/^\/(\w\w)\//.exec(this.eId) || [])[1];
  var isUrl = eId => eId.substr(0, 8).indexOf('//') !== -1;
  var playerId = getPlayerId(this.eId) || (isUrl(this.eId) ? 'fi' : 'xx');
  val[playerId] = 1;
  emit(renderDate(this._id.getTimestamp()), val);
});

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var sum = (a, b) => a + b;
  var finalVal = { total: 0 };
  vals.forEach(val =>
    Object.keys(val).forEach(
      key => (finalVal[key] = (finalVal[key] || 0) + val[key])
    )
  );
  return finalVal;
}

var opts = {
  out: {
    //inline: 1,
    replace: OUTPUT_COLLECTION // will store results in that collection
    // => took 9 minutes to run from db
  }
  //limit: 100000 // => runs in 2 seconds from db
};

var results = db.playlog.mapReduce(map, reduce, opts).results;
//print(results.map(res => [ res._id, JSON.stringify(res.value) ]).join('\n'));
