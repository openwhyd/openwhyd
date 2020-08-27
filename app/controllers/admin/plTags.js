/**
 * playlist tags / annotations evaluation console
 * @author adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js');
var plTagsModel = require('../../models/plTags.js');
var snip = require('../../snip.js');
var FileController = require('./FileController.js');
var util = require('util');

function wrapJsonGeneratorToText(name) {
  return function (p, cb) {
    fileGenerators[name](p, function (items) {
      var items = items.length ? { results: items } : items;
      //cb(JSON.stringify(items, null, 2));
      var lines = ['{'];
      for (var i in items) {
        lines.push('  "' + i + '": [');
        for (var u in items[i])
          lines.push(
            '    ' +
              util
                .inspect(items[i][u])
                .replace(/\n/g, ' ')
                .replace(/[ ]+/g, ' ') +
              ','
          );
        lines.push('  ],');
      }
      lines.push('}');
      cb(lines.join('\n'));
    });
  };
}

var fileGenerators = {
  // stats

  /** supported parameters:
   *   - tags = comma-separated list of tags
   **/
  'bestUsersForTags.json': function (p, cb) {
    var tags = plTagsModel.extractGenreTags((p || {}).tags);
    plTagsModel.getTagEngine(function (tagEngine) {
      cb(
        tagEngine.getUsersByTags(tags).map(function (user) {
          user.tags = (tagEngine.getBestTagsByUid(user.id) || [])
            .slice(0, 10)
            .map(function (tag) {
              return tag.id + ' (' + tag.c + ')';
            });
          return user;
        })
      );
    });
  },
  'bestUsersForTags.txt': wrapJsonGeneratorToText('bestUsersForTags.json'),

  nbTaggedTracks: function (p, cb) {
    plTagsModel.getTagEngine(function (tagEngine) {
      var nb = 0,
        total = 0,
        eids = {},
        eidToTags = tagEngine.eidToTags;
      mongodb.forEach(
        'track',
        { fields: { _id: 0, eId: 1 } },
        function (post) {
          if (eids[post.eId]) return;
          eids[post.eId] = true;
          total++;
          if ((eidToTags[post.eId] || []).length) ++nb;
        },
        function () {
          cb(
            'tagged tracks (thanks to playlists): ' +
              nb +
              ' / ' +
              total +
              ' = ' +
              (100 * nb) / total +
              '%'
          );
        }
      );
    });
  },

  nbTracksInPlaylists: function (p, cb) {
    mongodb.collections['post'].count({}, function (err, nbTracks) {
      mongodb.collections['post'].count(
        { 'pl.id': { $exists: true } },
        function (err, nbTracksInPlaylists) {
          cb(
            'number of tracks in playlists: ' +
              nbTracksInPlaylists +
              ' / ' +
              nbTracks +
              ' = ' +
              (100 * nbTracksInPlaylists) / nbTracks +
              '%'
          );
        }
      );
    });
  },
};

exports.controller = FileController.buildController({
  controllerName: 'admin.plTags',
  adminOnly: true,
  fileGenerators: fileGenerators,
});
