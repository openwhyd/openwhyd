const OUTPUT_COLLECTION = 'plot-nb-users-listening-per-day';

function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  emit(renderDate(this._id.getTimestamp()), {
    users: [ this.uId ]
  });
}

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var userSet = {};
  vals.forEach(val => val.users.forEach(uId => userSet[uId] = true));
  return {
    users: Object.keys(userSet)
  };
}

var opts = {
  finalize: function(key, reducedValue) {
    return reducedValue.users.length;
  },
  out: {
    //inline: 1, // => causes `too much data for in memory map/reduce` error
    'replace': OUTPUT_COLLECTION, // will store results in that collection
    // => took 10 minutes to run
  },
  //limit: 100000 // => runs in 4 seconds
};

var results = db.playlog.mapReduce(map, reduce, opts).results;
//print(results.map(res => [ res._id, res.value.users.length ]).join('\n'));
