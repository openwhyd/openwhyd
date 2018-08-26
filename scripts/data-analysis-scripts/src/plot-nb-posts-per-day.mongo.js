load('./mongo-helpers/period-aggregator.mongo.js'); // exports makeMapWith()

// notice: MongoDB will not call the reduce function for a key that has only a single value
const map = makeMapWith(renderDate, function mapTemplate() {
  // => emit same kind of output as reduce()'s
  emit(renderDate(this._id.getTimestamp()), 1);
});

function reduce(day, count) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var sum = (a, b) => a + b;
  return count.reduce(sum);
}

var opts = {
  out: { inline: 1 }
  //limit: 1000
};

var res = db.post.mapReduce(map, reduce, opts);
//print(res.results.map(res => [ res._id, res.value ]).join('\n'));
print(
  res.results
    .sort((a, b) => new Date(a._id) - new Date(b._id))
    .map(res => [res._id, res.value])
    .join('\n')
);
