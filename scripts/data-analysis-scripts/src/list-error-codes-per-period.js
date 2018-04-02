// usage: $ RENDER_FCT=renderDate node list-error-codes-per-period.js >list-error-codes-per-day.json.log

const { emit, mapReduceFromJsonLines } = require('./json-helpers/map-reduce-over-json-lines');

const { DAY, WEEK, MONTH, YEAR, today, makeDateRangeQuery } = require('./mongo-helpers/date-range.mongo.js');
const { renderDate, renderWeek, makeMapWith } = require('./mongo-helpers/period-aggregator.mongo.js');

// symbols that should be provided at runtime:
// - RENDER_FCT: function that will be used to aggregate _ids, e.g. 'renderDate'
// - PERIOD: (optional) range in milliseconds from today, e.g. 'YEAR', 'MONTH'

const INPUT_FILE = 'playlog.json.log'; // TODO: also support stdin (for shell-piping)
const RENDER_FCT = process.env.RENDER_FCT;
const PERIOD = process.env.PERIOD ? eval(process.env.PERIOD) : WEEK; // default value: 7 days


var renderFct = eval(RENDER_FCT); // => e.g. renderDate() or renderWeek()

// notice: MongoDB will not call the reduce function for a key that has only a single value
function mapTemplate() {
  //var failed = this.err ? 1 : 0;
  var val = { total: 1 }; //, total_err: failed
  var error = this.err ? this.err.code || this.err.error || this.err.data : undefined;
  if (error !== undefined) val[error] = 1;
  return emit(renderFct(this._id.getTimestamp()), val); // group error counts by week
}

const map = makeMapWith(renderFct, mapTemplate.toString()
  .replace('renderFct', RENDER_FCT)
  .replace('emit', '(' + emit.toString() + ')')
);

function reduce(day, vals) {
  // notice: MongoDB can invoke the reduce function more than once for the same key
  var finalVal = {};
  // sum counts for each period
  vals.forEach(val => Object.keys(val).forEach(key => finalVal[key] = (finalVal[key] || 0) + val[key]));
  return finalVal;
}

var opts = {
  finalize: function(key, reduced) {
    // list of player ids from https://github.com/openwhyd/openwhyd/blob/d27fb71220cbd29e9e418bd767426e3b4a2187f3/whydJS/public/js/whydPlayer.js#L559
    Object.keys(reduced)
      .filter(key => key !== 'total')
      .forEach(error => {
        reduced[error] = reduced[error] / reduced.total; // compute % of errors againt plays
      });
      delete reduced.total;
    return reduced;
  },
  query: makeDateRangeQuery(new Date(today - PERIOD)),
};

(async () => {

  console.warn('PERIOD: ' + PERIOD / (24 * 60 * 60 * 1000) + ' days')
  console.warn('RENDER_FCT: ' + RENDER_FCT);

  const startDate = new Date();
  console.warn(`Map-reducing ${INPUT_FILE} --> /dev/out ...`);
  // var result = db.playlog.mapReduce(map, reduce, opts);
  const results = await mapReduceFromJsonLines(INPUT_FILE, map, reduce, opts);
  console.warn(`⏲  Duration: ${(new Date() - startDate) / 1000} seconds`); // => ~3 mn (instead of 8 from db)

  console.log(results);

})();
