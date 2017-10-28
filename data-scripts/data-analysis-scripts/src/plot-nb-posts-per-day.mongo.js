function map() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
  emit(renderDate(this._id.getTimestamp()), 1);
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
