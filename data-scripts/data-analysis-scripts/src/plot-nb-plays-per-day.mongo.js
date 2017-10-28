const OUTPUT_COLLECTION = 'plot-nb-plays-per-day';

function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  var val = { total: 1 };
  val[this.eId.substr(1, 2)] = 1;
  emit(renderDate(this._id.getTimestamp()), val);
}

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var sum = (a, b) => a + b;
  var finalVal = { total: 0 };
  vals.forEach(val => Object.keys(val).forEach(key => finalVal[key] = (finalVal[key] || 0) + val[key]));
  return finalVal;
}

var opts = {
  /*
  finalize: function(key, reducedValue) {
    return reducedValue.users.length;
  },
  */
  out: {
    //inline: 1,
    'replace': OUTPUT_COLLECTION, // will store results in that collection
    // => took 9 minutes to run
  },
  //limit: 100000 // => runs in 2 seconds
};

var results = db.playlog.mapReduce(map, reduce, opts).results;
//print(results.map(res => [ res._id, JSON.stringify(res.value) ]).join('\n'));
