const util = require('util');

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
const normalizeNameSearchQuery = function (queryString) {
  const q = noaccent(queryString.trim().toLowerCase());
  const words = q.split(/\W+/);
  const result = [];

  // remove empty items
  for (const i in words) if (words[i].length > 0) result.push(words[i]);

  return result;
};

let timeout;

exports.topicNameSearch = function (
  q,
  resultHandler,
  mongodbModel,
  timeoutDuration,
  maxCycles,
  limit,
) {
  function mongodb(collection, cb) {
    cb(null, mongodbModel.collections[collection]);
  }

  if (!timeoutDuration) timeoutDuration = 1000; //msecs
  if (!maxCycles) maxCycles = 2; // number of times the timeout can be extended for gettings results
  if (!limit) limit = 5;
  const limitExact = 3,
    limitUsers = 3;

  if (timeout) clearTimeout(timeout);

  const userResults = [];

  mongodb('user', function (err, usercol) {
    const query = { name: new RegExp(q, 'i') /*{"$regex":q}*/ }; // case insensitive search
    console.log('user search query: ' + util.inspect(query));
    usercol.find(query, { limit: limitUsers }).then(function (cursor) {
      cursor.forEach((err, item) => {
        if (!item) return;
        userResults.push({ _id: '/u/' + item.fbId, name: item.name });
        console.log(
          'user search result: ' +
            item.fbId +
            ' : ' +
            item.name +
            ', ' +
            item.img,
        );
      });

      mongodb('topic', function (err, collection) {
        let cycles = maxCycles;
        const exactResults = [],
          quickResults = [];

        const words = normalizeNameSearchQuery(q);

        let query = { n: { $all: words } };
        console.log('search exact query: ' + util.inspect(query));
        collection
          .find(query, { sort: [['s', 'desc']], limit: limitExact })
          .then(function (cursor) {
            let remaining = limitExact;

            const handleNextResult = function (err, item) {
              //console.log("handleNextResult()");
              if (item != null) {
                console.log(
                  'search exact result: (' +
                    item.s +
                    ') ' +
                    item._id +
                    ' : ' +
                    item.name /* + ", " + item.t*/,
                );
                exactResults.push(item);
                --remaining;
                if (remaining > 0) cursor.next(handleNextResult); //recursive call for next objects
              } else cursor.queryRun = false;
            };

            cursor.next(handleNextResult); // start gathering results
          });

        query = { n: words[0] /*{"$regex":q}*/ };
        console.log('search quick query: ' + util.inspect(query));
        collection
          .find(query, { limit /*sort: [['$natural', 'asc']]*/ })
          .then(function (cursor) {
            let remaining = limit;

            const handleNextResult = function (err, item) {
              //console.log("handleNextResult()");
              if (item != null) {
                console.log(
                  'search quick result: (' +
                    item.s +
                    ') ' +
                    item._id +
                    ' : ' +
                    item.name /* + ", " + item.t*/,
                );
                quickResults.push(item);
                --remaining;
                if (remaining > 0) cursor.next(handleNextResult); //recursive call for next objects
              } else cursor.queryRun = false;
            };

            cursor.next(handleNextResult); // start gathering results
          });

        const renderer = function () {
          clearTimeout(timeout);
          let results = exactResults;

          // combine exact and quick results without duplicates
          if (exactResults.length > 0 && quickResults.length > 0)
            for (const j in quickResults) {
              let found = false;
              for (const i in exactResults)
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
