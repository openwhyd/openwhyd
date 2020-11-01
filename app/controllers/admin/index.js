/**
 * search index admin. console
 * @author adrienjoly, whyd
 **/

var mongodb = require('../../models/mongodb.js');
var searchModel = require('../../models/search.js');

var indexCol = {
  user: 'user',
  post: 'post',
  playlist: 'user',
};

var indexFields = {
  // different from the one from search.js model
  user: { _id: 1, name: 1, email: 1, handle: 1 },
  post: { _id: 1, name: 1, text: 1, uId: 1, eId: 1, pl: 1 },
  playlist: { _id: 1, name: 1, pl: 1, uId: 1 },
};

function deleteIndex(type, cb) {
  console.log('Deleting ' + type + 's from index ...');
  searchModel.deleteAllDocs(type, function (r) {
    console.log('Deleting ' + type + 's from index: DONE!');
    if (cb) cb(r);
  });
}

function refreshIndex(type, cb, preprocess) {
  var BULK_SIZE = 1000,
    bulkDocs = [],
    fetched = 0,
    indexed = 0;
  console.log('Indexing ' + type + 's ...');
  function flush(cb) {
    searchModel.indexBulk(bulkDocs, function (r) {
      r = r || {};
      if (r.errors || r.error)
        console.error(
          '[ERR] (BULK) admin.index.refreshIndex, searchModel.index: ' +
            (r.errors || r.error)
        );
      indexed += (r.items || []).length || 0;
      cb();
    });
    bulkDocs = [];
  }
  function index(doc, cb) {
    if (doc) {
      doc._type = doc._type || type;
      //searchModel.index(doc, cb);
      bulkDocs.push(doc);
    }
    if (bulkDocs.length >= BULK_SIZE) flush(cb);
    else cb();
  }
  var process = !preprocess
    ? index
    : function (obj, fetchAndProcessNextObject) {
        preprocess(obj, fetchAndProcessNextObject, index);
      };
  var options = {
    fields: indexFields[type],
    //limit: 9999999,
    sort: [['_id', 'desc']],
    batchSize: 1000,
  };
  console.log('index: iterating on collection:', indexCol[type]);
  mongodb.collections[indexCol[type]].find({}, options, function (err, cursor) {
    (function next() {
      cursor.next(function (err, u) {
        if (err)
          console.log('[ERR] admin.index.refreshIndex, db.nextObject: ', err);
        if (u != null) {
          ++fetched;
          process(u, function () {
            if (fetched % 100 == 0)
              console.warn('=> last (BULK) indexed document: ', u._id);
            setTimeout(next /*, 100*/);
          });
        } else {
          flush(function () {
            console.log(
              'admin.index.refreshIndex DONE! => indexed',
              indexed,
              'documents from',
              fetched,
              'fetched db records'
            );
            cb && cb();
          });
        }
      });
    })();
  });
}

var indexFcts = {
  deleteUserIndex: function (cb) {
    deleteIndex('user', cb);
  },
  deletePostIndex: function (cb) {
    deleteIndex('post', cb);
  },
  deletePlaylistIndex: function (cb) {
    deleteIndex('playlist', cb);
  },
  refreshUserIndex: function (cb) {
    refreshIndex('user', cb);
  },
  refreshPostIndex: function (cb) {
    refreshIndex('post', cb);
  },
  refreshPlaylistIndex: function (cb) {
    refreshIndex('playlist', cb, function (user, nextUser, index) {
      function nextPlaylist() {
        var p = user.pl.pop();
        if (!p) nextUser();
        // no more playlists for this user => process next user
        else {
          p._id = '' + user._id + '_' + p.id;
          delete p.id;
          index(p, nextPlaylist);
        }
      }
      if (!user || !user.pl || !user.pl.length) nextUser();
      else nextPlaylist();
    });
  },
};

function countDbUsersAndPlaylists(cb) {
  var result = {
    dbUsers: 0,
    dbPlaylists: 0,
  };
  mongodb.collections[indexCol['user']].find(
    {},
    { fields: { pl: 1 } },
    function (err, cursor) {
      (function nextUser() {
        cursor.next(function (err, user) {
          if (!user) cb(result);
          else {
            ++result.dbUsers;
            if (user.pl) result.dbPlaylists += user.pl.length;
            setImmediate(nextUser);
          }
        });
      })();
    }
  );
}

function countItems(cb) {
  countDbUsersAndPlaylists(function (p) {
    mongodb.collections[indexCol['post']].countDocuments(function (
      err,
      dbPosts
    ) {
      p.dbPosts = dbPosts;
      searchModel.countDocs('user', function (idxUsers) {
        p.idxUsers = idxUsers;
        searchModel.countDocs('post', function (idxPosts) {
          p.idxPosts = idxPosts;
          searchModel.countDocs('playlist', function (idxPlaylists) {
            p.idxPlaylists = idxPlaylists;
            /*
						p = {
							idxUsers: idxUsers,
							idxPosts: idxPosts,
							idxPlaylists: idxPlaylists,
							dbUsers: dbUsers,
							dbPosts: dbPosts,
							dbPlaylists: dbPlaylists
						};*/
            cb(p);
          });
        });
      });
    });
  });
}

function renderForm(p) {
  return [
    //	'<p>' + (p.message || '') + '</p>',
    '<form method="post">',
    '<p>User index ( ' + p.idxUsers + ' / ' + p.dbUsers + ' )',
    '<input type="submit" name="deleteUserIndex" value="DELETE">',
    '<input type="submit" name="refreshUserIndex" value="refresh">',
    '</p>',
    '<p>Post index ( ' + p.idxPosts + ' / ' + p.dbPosts + ' )',
    '<input type="submit" name="deletePostIndex" value="DELETE">',
    '<input type="submit" name="refreshPostIndex" value="refresh">',
    '</p>',
    '<p>Playlist index ( ' + p.idxPlaylists + ' / ' + p.dbPlaylists + ' )',
    '<input type="submit" name="deletePlaylistIndex" value="DELETE">',
    '<input type="submit" name="refreshPlaylistIndex" value="refresh">',
    '</p>',
    '</form>',
  ].join('\n');
}

exports.controller = function (request, reqParams = {}, response) {
  request.logToConsole('admin.index.controller', request.body || reqParams);

  // make sure an admin is logged, or return an error page
  reqParams.loggedUser = request.checkAdmin(response);
  if (!reqParams.loggedUser) return;

  if (request.method.toLowerCase() === 'post') {
    for (let i in indexFcts)
      if (request.body[i])
        return indexFcts[i](function (r) {
          response.legacyRender(r || { ok: 'done' });
        });
    response.badRequest();
  } else
    countItems(function (p) {
      p.message = reqParams.message;
      response.renderHTML(renderForm(p));
    });
};
