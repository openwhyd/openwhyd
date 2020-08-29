/**
 * track API controller
 */

var mongodb = require('../../models/mongodb.js');
var trackModel = require('../../models/track.js');

var ACTIONS = {
  refresh: function (p, cb) {
    if (!p.eId) return cb({ error: 'missing parameter: eId' });
    console.log('refreshing track metadata for eId', p.eId);
    trackModel.updateAndPopulateMetadata(p.eId, cb, true);
  },
  listBySource: function (p, cb) {
    var list = [];
    mongodb.collections['track'].count(function (err, total) {
      function whenDone() {
        cb(
          JSON.stringify(
            {
              total: total,
              count: list.length,
              list: list,
            },
            null,
            2
          )
        );
      }
      var i = 0;
      mongodb.forEach2(
        'track',
        { fields: { _id: 0, eId: 1, pId: 1, name: 1 } },
        function (track, next) {
          if (!track) whenDone();
          else {
            if (++i % 100) console.log('listBySource', i, '/', total);
            if ((track.eId || '').indexOf('/dz/') == 0)
              list.push([track.eId, track.pId, track.name]);
            next();
          }
        }
      );
    });
  },
  fetchMetadataConfidence: function (p, cb) {
    var countPerConfidence = {};
    function whenDone() {
      console.log('countPerConfidence', countPerConfidence);
    }
    mongodb.collections['track'].count(function (err, count) {
      var i = 0;
      cb({ total: count });
      mongodb.forEach2(
        'track',
        { fields: { _id: 0, eId: 1, meta: 1 } },
        function (track, next) {
          if (!track) whenDone();
          else {
            if (++i % 10)
              console.log(
                'fetchMetadataConfidence',
                i,
                '/',
                count,
                track.eId,
                track.name
              );
            if ((track.eId || '').indexOf('/yt/') == 0) {
              var c = (track.meta || {}).c;
              countPerConfidence[c] = (countPerConfidence[c] || 0) + 1;
            }
            next();
          }
        }
      );
    });
  },
  fetchMetadataForHotTracks: function (p, cb) {
    var countPerConfidence = {},
      countPerSource = {},
      count = 50;
    mongodb.collections['track']
      .find(
        {},
        {
          fields: { _id: 0, eId: 1, name: 1, meta: 1 },
          sort: { score: -1 },
          limit: count,
        }
      )
      .toArray(function (err, tracks) {
        for (let i in tracks) {
          var track = tracks[i];
          console.log(
            'fetchMetadataForHotTracks',
            i,
            '/',
            count,
            !!track.meta,
            track.eId,
            track.name
          );
          var eId = track.eId || '';
          if (!eId) continue;
          countPerSource[eId.substr(1, 2)] =
            (countPerSource[eId.substr(1, 2)] || 0) + 1;
          if (eId.indexOf('/yt/') == 0) {
            var c = (track.meta || {}).c;
            countPerConfidence[c] = (countPerConfidence[c] || 0) + 1;
          }
        }
        console.log(
          'fetchMetadataForHotTracks, countPerConfidence:',
          countPerConfidence
        );
        cb({
          countPerConfidence: countPerConfidence,
          countPerSource: countPerSource,
        });
      });
  },
  default: function (p, cb) {
    if (!p.eId) return cb({ error: 'missing parameter: eId' });
    /*
		if (p.extract)
			trackModel.fetchConciseMetadataForEid(p.eId, cb);
		else
		*/

    // use metadata cached in whyd's database (track collection)
    trackModel.fetchTrackByEid(p.eId, cb);
    // TODO: add "extract and update" option
  },
};

exports.controller = function (request, reqParams, response) {
  request.logToConsole('track.api.controller', reqParams);

  // make sure a registered user is logged, or return an error page
  var loggedInUser = request.checkLogin();
  if (!loggedInUser || !reqParams) return response.badRequest();

  var isAdmin = request.isAdmin();

  p = reqParams;

  if (reqParams._1 && reqParams._2)
    p.eId = request.url.split('/api/track')[1].split('?')[0];
  else if (isAdmin && reqParams._1 && !reqParams.action)
    reqParams.action = reqParams._1;

  ACTIONS[reqParams.action || 'default'](p, function (res) {
    response.renderJSON(res);
  });
};
