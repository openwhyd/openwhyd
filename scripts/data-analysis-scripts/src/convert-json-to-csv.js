// usage: $ node convert-json-to-csv.js db-output.json >db-output.csv

const INPUT_FILE = process.argv[2];
const object = require('./' + INPUT_FILE);

const render = value => value; // typeof value === 'string' ? `"${value.replace(/"/g, '\\\"')}"` : value;
const makeRowRenderer = separator => array => array.map(render).join(separator);

/**
 * Generator that converts each property of object into a csv line.
 * Equivalent of:
 * $ echo $COLUMNS >$OUT.temp.csv
 * $ mongoexport -d $DB -c "$LISTNAME" --type=csv --fields "$FIELDS" | tail -n+2 >>$OUT.temp.csv
 * $ ./csv-helpers/fill-empty-values.sh $OUT.temp.csv 0
 */
function * generateCsvLines (object, opts = {}) {
  const defaultValue = opts.defaultValue !== undefined ? opts.defaultValue : '';
  const renderRow = makeRowRenderer(opts.separator || ',');
  const fields = Array.from(Object.keys(object).reduce((fieldSet, _id) => {
    Object.keys(object[_id]).forEach(field => fieldSet.add(field))
    return fieldSet;
  }, new Set()));
  if (fields.length === 0) {
    const header = ['_id', 'value'];
    yield renderRow(header);
    for (var _id in object) {
      yield renderRow([ _id, object[_id] ]);
    }
  } else {
    const header = [].concat.apply(['_id'], fields.map(field => `value.${field}`))
    yield renderRow(header);
    for (var _id in object) {
      yield renderRow([].concat.apply([ _id ], fields.map(field => {
        const value = object[_id][field];
        return (value === undefined || value === null) ? defaultValue : value;
      })))
    }
  }
}

var csvLineGenerator = generateCsvLines(object, { defaultValue: 0 });

for (let csvLine of csvLineGenerator) {
  console.log(csvLine);
}
