// input: stream of `YYYY-MM-DD,ref` lines
// output: `YYYY-MM-DD <total_occurences> <iphone_ref_occurences>` lines

const SEPARATOR_IN = ',';
const SEPARATOR_OUT = ' ';
const refs = [ 'iPhoneApp' ];
const cols = [ 'date', 'total' ].concat(refs);

const getObjValues = obj => Object.values ? Object.values(obj) : Object.keys(obj).map(k => obj[k]);
function groupLines(str) {
  return str.trim().split('\n').reduce((out, line) => {
    const [ date, ref ] = line.split(SEPARATOR_IN);
    out[date] = out[date] || { date, count: {} };
    out[date].count[ref] = (out[date].count[ref] || 0) + 1;
    return out;
  }, {});
}
function render(group) {
  return [
    getObjValues(group.count).reduce((all, nb) => all + nb, 0),
    group.count.iPhoneApp || 0, // TODO: use each value of refs instead
  ].join(SEPARATOR_OUT);
}
// stream from stdin. (useful for shell pipe operator)
var lines = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(chunk) {
  lines += chunk;
});
process.stdin.on('end', function() {
  console.log(cols.join(SEPARATOR_OUT));
  var grouped = groupLines(lines)
  for (var date in grouped) {
    console.log(date, render(grouped[date]));
  }
});
