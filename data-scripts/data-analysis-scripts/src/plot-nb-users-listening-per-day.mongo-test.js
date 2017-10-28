function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
  // notice: MongoDB will not call the reduce function for a key that has only a single value
  // => emit same kind of output as reduce()'s
  var users = {};
  users[this.uId] = true;
  emit(renderDate(this._id.getTimestamp()), { users });
}

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var users = Object.assign.apply(Object, vals.map(val => val.users)); //vals.pop().users;
  return { users };
}

var opts = {
  out: { inline: 1 },
  limit: 100000 // => runs in 15 seconds
};

var results = db.playlog.mapReduce(map, reduce, opts).results;
print(results.map(res => [ res._id, Object.keys(res.value.users).length ]).join('\n'));
