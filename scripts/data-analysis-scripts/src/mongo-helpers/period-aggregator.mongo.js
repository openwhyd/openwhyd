// re-useable helpers to generate mongodb map functions
// (mongoshell-compatible dependency injection)

// creates a renderDate() function to be used from map() functions
function renderDate() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderDate = t =>
    new Date(DAY_MS * Math.floor(t / DAY_MS)).toISOString().split('T')[0];
}

// creates a renderWeek() function to be used from map() functions
function renderWeek() {
  var DAY_MS = 1000 * 60 * 60 * 24;
  var renderWeek = t => {
    var onejan = new Date(t.getFullYear(), 0, 1);
    var week =
      '' + Math.ceil(((t - onejan) / DAY_MS + onejan.getDay() + 1) / 7);
    return [
      t.getFullYear(),
      week.length === 2 ? week : '0' + week // pad with leading 0 if necessary, for final sorting
    ].join('.');
  };
}

// generates a map function after injecting code from the mapHelpers() function
function makeMapWith(mapHelpers, mapTemplate) {
  const getFuncBody = fct => {
    var entire = fct.toString();
    return entire.substring(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
  };
  return new Function(
    [getFuncBody(mapHelpers), getFuncBody(mapTemplate)].join('\n')
  );
}

// const map = makeMapWith(mapHelpers, mapTemplate);

// to make this module loadable from node.js
module.exports = {
  renderDate,
  renderWeek,
  makeMapWith
};
