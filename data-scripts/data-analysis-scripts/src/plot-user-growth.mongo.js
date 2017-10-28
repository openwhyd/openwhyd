function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  emit(renderDate(this._id.getTimestamp()), {
    total: 1,
    iPhoneApp: this.iRf === 'iPhoneApp' ? 1 : 0
  });
}

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var sum = (a, b) => a + b;
  return {
    total: vals.map(val => val.total).reduce(sum),
    iPhoneApp: vals.map(val => val.iPhoneApp).reduce(sum),
  };
}

var opts = {
  out: { inline: 1 },
  //limit: 1000
};

var results = db.user.mapReduce(map, reduce, opts).results;
print(results.map(res => [ res._id, res.value.total || 0, res.value.iPhoneApp || 0 ]).join('\n'));
