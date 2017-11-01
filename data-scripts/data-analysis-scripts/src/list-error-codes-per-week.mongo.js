// usage: $ mongo openwhyd_dump list-error-codes-per-week.mongo.js

const OUTPUT_COLLECTION = 'list-error-codes-per-week';

function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderWeek = t => {
    var onejan = new Date(t.getFullYear(), 0, 1);
    var week = '' + (Math.ceil( (((t - onejan) / DAY_MS) + onejan.getDay() + 1) / 7 ));
    return [
      t.getFullYear(),
      week.length === 2 ? week : '0' + week // pad with leading 0 if necessary, for final sorting
    ].join('.');
  };
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  if (!this.err) return;
  var val = { total: 1 };
  var error = this.err ? this.err.code || this.err.error || this.err.data : null;
  val[error] = 1;
  emit(renderWeek(this._id.getTimestamp()), val); // group error counts by week
}

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  // sum counts for each week
  vals.forEach(val => Object.keys(val).forEach(key => finalVal[key] = (finalVal[key] || 0) + val[key]));
  return finalVal;
}

var opts = {
  out: {
    'replace': OUTPUT_COLLECTION, // will store results in that collection
    // => took 5 minutes to run
  },
  //limit: 1000000 // => runs in 7 seconds
};

var result = db.playlog.mapReduce(map, reduce, opts);
print('⏲  ' + Math.round(result.timeMillis / 1000) + ' seconds');
printjson(db[OUTPUT_COLLECTION].find().toArray());
