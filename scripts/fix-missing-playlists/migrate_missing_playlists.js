function forEachFileLine(file, handler) {
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(file),
  });
  lineReader.on('line', handler);
}

var origPlaylists = {};
console.warn('loading ./users_whydcom.json...');
forEachFileLine('./users_whydcom.json', function (line) {
  var user = JSON.parse(line);
  origPlaylists['' + user._id.$oid] = user.pl;
});

console.warn('loading ./users_prod.json...');

//console.log(`db = db.getSiblingDB("openwhyd_data");`);

forEachFileLine('./users_prod.json', function (line) {
  var user = JSON.parse(line);
  var origPl = origPlaylists['' + user._id.$oid] || [];
  var currPl = user.pl || [];
  var missing = origPl.length - currPl.length;
  if (missing > 0) {
    console.log(
      user._id.$oid,
      origPl.length,
      '->',
      currPl.length,
      '=> missing:',
      origPl.length - currPl.length
    );
    console.log(' orig:', origPl);
    console.log(' curr:', currPl);
    /*
    console.log(`
      db.user.update({ "_id" : ObjectId("` + user._id.$oid + `"), }, { "$set" : {
        "pl" : ` + JSON.stringify(origPl) + `
      } });      
    `);
    */
  }
});
