/**
 * analytics model
 * @author adrienjoly, whyd
 **/

var fs = require('fs');
//var mongodb = require("./mongodb.js");
var snip = require('../snip.js');

var playlogStream = fs.createWriteStream('./playlog.json.log', {
  flags: 'a',
  encoding: 'utf8',
  autoClose: true
});

var visitStream = fs.createWriteStream('./visits.json.log', {
  flags: 'a',
  encoding: 'utf8',
  autoClose: true
});

/**
 * obj fields parameters:
 * - eId: (string) id of the track, without hash suffix (e.g. /yt/e34tr6, /sc/coucou/pouet)
 * - pId: (string) id of the post
 * - uId: (string) id of the user who played the track
 * - own: (boolean, optional) existing and set to true only if this track being played is one of his own posts
 * - err: (object, optional) player-dependant error structure. may contain an error code and/or message.
 * - fbk: (object, optional) structure provided by the fallback mechanism, in case of error while trying to play the track. may contain the status of connection with Deezer (not connected /  connected / premium), a Deezer track id (in case of lookup success), an error code and/or message.
 **/
exports.addPlay = (function() {
  var MANDATORY = { eId: 'string', pId: 'string', uId: 'string' },
    OPTIONAL = {
      own: 'boolean',
      err: 'object',
      fbk: 'object',
      ua: 'object',
      foc: 'boolean'
    };
  return function(obj) {
    try {
      var cleanObj = snip.checkParams(obj, MANDATORY, OPTIONAL);
      cleanObj.eId = cleanObj.eId.split('#')[0];
      //console.log(("addPlay: " + JSON.stringify(cleanObj)).cyan);
      //mongodb.collections["playlog"].insertOne(cleanObj, {w:0});
      cleanObj._t = new Date().getTime();
      playlogStream.write(JSON.stringify(cleanObj) + '\n');
    } catch (e) {
      console.error(e.stack);
    }
  };
})();
/*
var tests = [
	{},
	{eId:"", pId:"", uId:""},
	{eId:"", pId:"", uId:"", coco:1},
	{eId:"", pId:"", uId:"", own:false},
	{eId:"", pId:"", uId:"", own:"pouet"},
	{eId:"", pId:{}, uId:""},
	1
].map(function(test){
	console.log("TEST", test, " => ", exports.addPlay(test));
});
*/

exports.addVisit = function(uId, tId, request) {
  var orig = request;

  if (uId) {
    if ((typeof uId).toLowerCase() == 'object' && uId.id) uId = uId.id;
    uId = uId.replace('/u/', '');
  }

  /*if (reqParams && reqParams.orig)
		orig = reqParams.orig;
	else*/
  if (
    request &&
    (typeof request).toLowerCase() == 'object' &&
    request.headers &&
    request.headers.referer
  )
    // request
    orig = request.headers.referer;

  if (orig) {
    if (orig.contains('facebook.com')) orig = 'fb';
    else if (orig.contains('twitter.com')) orig = 'tw';
    else if (orig.contains('http')) orig = null;
  }

  console.log('analytics.addVisit ', uId, tId, orig);

  var visit = { uId: uId, tId: tId };
  if (orig) visit.orig = orig;

  //mongodb.collections["visit"].insertOne(visit, {w:0}); // disabled write concern
  visit._t = new Date().getTime();
  visitStream.write(JSON.stringify(visit) + '\n');
};
