var util = require('util');

// search functions -- not a controller

function noaccent(chaine) {
  let temp = chaine.replace(/[àâä]/gi, 'a');
  temp = temp.replace(/[éèêë]/gi, 'e');
  temp = temp.replace(/[îï]/gi, 'i');
  temp = temp.replace(/[ôö]/gi, 'o');
  temp = temp.replace(/[ùûü]/gi, 'u');
  return temp;
}

// must be executed on a name search query before submitting to mongodb
var normalizeNameSearchQuery = function (queryString) {
  var q = noaccent(queryString.trim().toLowerCase());
  var words = q.split(/\W+/);
  var result = [];

  // remove empty items
  for (let i in words) if (words[i].length > 0) result.push(words[i]);

  return result;
};

var timeout;

exports.topicNameSearch = function (
  q,
  resultHandler,
  mongodbModel,
  timeoutDuration,
  maxCycles,
  limit
) {
  function mongodb(collection, cb) {
    cb(null, mongodbModel.collections[collection]);
  }

  if (!timeoutDuration) timeoutDuration = 1000; //msecs
  if (!maxCycles) maxCycles = 2; // number of times the timeout can be extended for gettings results
  if (!limit) limit = 5;
  var limitExact = 3,
    limitUsers = 3;

  if (timeout) clearTimeout(timeout);

  var userResults = [];

  mongodb('user', function (err, usercol) {
    var query = { name: new RegExp(q, 'i') /*{"$regex":q}*/ }; // case insensitive search
    console.log('user search query: ' + util.inspect(query));
    usercol.find(query, { limit: limitUsers }, function (err, cursor) {
      cursor.forEach(function (err, item) {
        if (item != null) {
          userResults.push({ _id: '/u/' + item.fbId, name: item.name });
          console.log(
            'user search result: ' +
              item.fbId +
              ' : ' +
              item.name +
              ', ' +
              item.img
          );
        }
      });

      mongodb('topic', function (err, collection) {
        var cycles = maxCycles;
        var exactResults = [],
          quickResults = [];

        var words = normalizeNameSearchQuery(q);

        var query = { n: { $all: words } };
        console.log('search exact query: ' + util.inspect(query));
        collection.find(
          query,
          { sort: [['s', 'desc']], limit: limitExact },
          function (err, cursor) {
            var remaining = limitExact;

            var handleNextResult = function (err, item) {
              //console.log("handleNextResult()");
              if (item != null) {
                console.log(
                  'search exact result: (' +
                    item.s +
                    ') ' +
                    item._id +
                    ' : ' +
                    item.name /* + ", " + item.t*/
                );
                exactResults.push(item);
                if (--remaining > 0) cursor.nextObject(handleNextResult); //recursive call for next objects
              } else cursor.queryRun = false;
            };

            cursor.nextObject(handleNextResult); // start gathering results
          }
        );

        query = { n: words[0] /*{"$regex":q}*/ };
        console.log('search quick query: ' + util.inspect(query));
        collection.find(
          query,
          { /*sort:[['$natural','asc']],*/ limit: limit },
          function (err, cursor) {
            var remaining = limit;

            var handleNextResult = function (err, item) {
              //console.log("handleNextResult()");
              if (item != null) {
                console.log(
                  'search quick result: (' +
                    item.s +
                    ') ' +
                    item._id +
                    ' : ' +
                    item.name /* + ", " + item.t*/
                );
                quickResults.push(item);
                if (--remaining > 0) cursor.nextObject(handleNextResult); //recursive call for next objects
              } else cursor.queryRun = false;
            };

            cursor.nextObject(handleNextResult); // start gathering results
          }
        );

        var renderer = function () {
          clearTimeout(timeout);
          var results = exactResults;

          // combine exact and quick results without duplicates
          if (exactResults.length > 0 && quickResults.length > 0)
            for (let j in quickResults) {
              var found = false;
              for (let i in exactResults)
                if (exactResults[i]._id === quickResults[j]._id) {
                  //console.log("found dup " + exactResults[i].name);
                  found = true;
                  break;
                }
              if (false == found) results.push(quickResults[j]);
            }
          else results = results.concat(quickResults);

          results = userResults.concat(results);

          if (results.length == 0) {
            console.log('search: no results so far...');
            if (cycles-- == 0) resultHandler([], q);
            //response.legacyRender("");
            else timeout = setTimeout(renderer, timeoutDuration);
          } else {
            //console.log(renderTemplate(q,results));
            //response.legacyRender(util.inspect(results));
            resultHandler(results, q);
            // console.log('search: rendering done!');
          }
        };
        var timeout = setTimeout(renderer, timeoutDuration);
      });
    });
  });
};
