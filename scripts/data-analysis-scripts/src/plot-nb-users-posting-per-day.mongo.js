/* globals db, load, makeMapWith, emit, renderDate */

load('./mongo-helpers/period-aggregator.mongo.js'); // exports makeMapWith()

// notice: MongoDB will not call the reduce function for a key that has only a single value
const map = makeMapWith(renderDate, function mapTemplate() {
  // => emit same kind of output as reduce()'s
  emit(renderDate(this._id.getTimestamp()), {
    users: [this.uId],
    count: 1,
  });
});

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var userSet = {};
  vals.forEach((val) => val.users.forEach((uId) => (userSet[uId] = true)));
  var users = Object.keys(userSet);
  return {
    users,
    count: users.length,
  };
}

var opts = {
  out: { inline: 1 },
  // limit: 1000
};

var res = db.post.mapReduce(map, reduce, opts);
//print(res.results.map(res => [ res._id, res.value.count ]).join('\n'));
print(
  res.results
    .sort((a, b) => new Date(a._id) - new Date(b._id))
    .map((res) => [res._id, res.value.count])
    .join('\n'),
);
