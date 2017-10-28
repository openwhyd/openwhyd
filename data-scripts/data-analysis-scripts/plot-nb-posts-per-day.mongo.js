function map() {
  emit(new Date(1000 * 60 * 60 * 24 * Math.floor(this._id.getTimestamp() / (1000 * 60 * 60 * 24))).toISOString().split('T')[0], 1);
}

function reduce(day, n) {
  return n.length;
}

var opts = {
  out: { inline: 1 },
  //limit: 1000
};

Object.values = Object.values || (arr => Object.keys(arr).map(key => arr[key]));

var results = db.post.mapReduce(map, reduce, opts).results;

//print(results.map(JSON.stringify).join('\n'));
print(results.map(Object.values).join('\n'));
