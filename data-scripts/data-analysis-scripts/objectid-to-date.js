// simple command to replace `ObjectId(xxx)` matches with `YYYY-MM-DD` dates
function dateFromObjectId (objectId) {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
}
function convertMatch(full, oIdString, oIdOnly) {
  return full.replace(oIdString, dateFromObjectId(oIdOnly).toISOString().substr(0, 10));
}
function replaceMatches(input) {
  return input.replace(/(ObjectId\(([0-9a-f]+)\))/g, convertMatch);
}
if (process.argv[2]) {
  // if a command line argument is provided, just convert ObjectIds from that argument
  console.log(replaceMatches(process.argv[2]));
} else {
  // otherwise, listen to stdin. (useful for shell pipe operator)
  var data = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) {
    data += chunk;
  });
  process.stdin.on('end', function() {
    console.log(replaceMatches(data));
  });
}
