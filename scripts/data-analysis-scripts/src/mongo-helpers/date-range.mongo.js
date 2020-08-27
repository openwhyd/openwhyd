try {
  ObjectId;
} catch (err) {
  ObjectId = {
    fromDate: (date) => date, // will be handled by mapReduceFromJsonLines()
  };
}

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;
const today = new Date();

const makeDateRangeQuery = (from, to = today) => ({
  _id: {
    $gt: ObjectId.fromDate(from),
    $lt: ObjectId.fromDate(to),
  },
});

//printjson(db.playlog.find(makeDateRangeQuery(new Date(today - WEEK))).toArray());

// to make this module loadable from node.js
module.exports = {
  DAY,
  WEEK,
  MONTH,
  YEAR,
  today,
  makeDateRangeQuery,
};
