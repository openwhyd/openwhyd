/**
 * Wraps search requests to algolia index
 * @author adrien joly, whyd
 **/

const snip = require('../snip.js');
const mongodb = require('./mongodb.js');
const algoliasearch = require('algoliasearch');

if (process.env['ALGOLIA_APP_ID'] === undefined)
  throw new Error(`missing env var: ALGOLIA_APP_ID`);
if (process.env['ALGOLIA_API_KEY'] === undefined)
  throw new Error(`missing env var: ALGOLIA_API_KEY`);

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY, // required ACLs: search, browse, addObject, deleteObject, listIndexes, editSettings, deleteIndex
);

const INDEX_NAME_BY_TYPE = {
  user: 'users',
  track: 'tracks',
  post: 'posts',
  playlist: 'playlists',
};

const INDEX_TYPE_BY_NAME = {
  users: 'user',
  tracks: 'track',
  posts: 'post',
  playlists: 'playlist',
};

// fields that will be indexed for search and faceting (together with the `name` field)
const INDEX_FIELDS_BY_TYPE = {
  user: ['handle'],
  track: [],
  post: ['text', 'uId'],
  playlist: [],
};

// fields that will be stored in the search index's documents
const FIELDS_BY_TYPE = {
  user: INDEX_FIELDS_BY_TYPE.user.concat(['name', /*'img',*/ 'nbPosts']),
  track: INDEX_FIELDS_BY_TYPE.track.concat([
    'name',
    /*'img',*/ 'nbPosts',
    'post',
  ]),
  post: INDEX_FIELDS_BY_TYPE.post.concat(['name', /*'img',*/ 'eId', 'pl']),
  playlist: INDEX_FIELDS_BY_TYPE.playlist.concat(['name', 'number', 'nbPosts']),
};

// lazy init and caching of indexes
const getIndex = (function () {
  const INDEX = {}; // cache of indexes
  return function (indexName) {
    let index = INDEX[indexName];
    if (!index) {
      index = INDEX[indexName] = client.initIndex(indexName);
      // init field indexing settings
      const fields = INDEX_FIELDS_BY_TYPE[INDEX_TYPE_BY_NAME[indexName]] || [];
      index.setSettings({
        attributesForFaceting: ['name'].concat(
          fields.map(function (field) {
            return 'filterOnly(' + field + ')';
          }),
        ),
      });
    }
    return index;
  };
})();

function Search() {
  /* empty class definition */
}

Search.prototype.search = function (index, query, options, cb) {
  const facetAttrs = [];
  const facetFilters = [];
  let i, q;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  if (typeof query === 'string') {
    q = query;
  } else {
    q = query.q;
    delete query.q;
    for (i in query) {
      facetAttrs.push(i);
      facetFilters.push(i + ':' + query[i]);
    }
    options = options || {};
    options.facets = facetAttrs.join(',');
    options.facetFilters = facetFilters;
  }
  if (!cb) {
    throw new Error(
      'please pass a callback parameter when calling Search.prototype.search',
    );
  }
  getIndex(index)
    .search(q, options)
    .catch(cb)
    .then((success) => cb(null, success));

  return this;
};

function makeCallbackTranslator(type, cb) {
  function translateResult(r) {
    r._type = type;
    r._id = r.objectID.replace(':', '_');
    delete r.objectID;
    return r;
  }
  return function (err, res) {
    if (err) cb({ error: err });
    else {
      res.hits = res.hits.map(translateResult);
      cb(res);
    }
  };
}

const FIELD_MAPPING = {
  limit: 'hitsPerPage',
};

function extractOptions(q) {
  return snip.filterFields(q, FIELD_MAPPING);
}

const searchIndex = new Search();

const searchByType = {
  user: function (q, cb) {
    console.log('[search] search users', q);
    const options = extractOptions(q);
    return searchIndex.search(
      'users',
      q.q,
      options,
      makeCallbackTranslator('user', cb),
    );
    // tested http://localhost:8080/search?q=adrien&context=mention
    //     => { q: 'adrien', limit: 6 }
    // tested http://localhost:8080/search?q=pouet&context=header
    //     => { q: 'pouet' }
  },
  track: function (q, cb) {
    console.log('[search] search tracks', q);
    const options = extractOptions(q);
    return searchIndex.search(
      'tracks',
      q.q,
      options,
      makeCallbackTranslator('track', function (res) {
        (res.hits || []).map(function (h) {
          h.eId = h._id;
          h._id = mongodb.ObjectId(h.post);
          delete h.post;
        });
        cb(res);
      }),
    );
  },
  post: function (q, cb) {
    console.log('[search] search posts', q);
    const options = extractOptions(q);
    if (q.uId) {
      q = {
        q: q.q,
        uId: q.uId,
      };
      return searchIndex.search(
        'posts',
        q,
        options,
        makeCallbackTranslator('post', cb),
      );
      // tested http://localhost:8080/search?q=adrien&context=quick
      //     => { q: 'adrien', uId: '4d94501d1f78ac091dbc9b4d', limit: 10 }
      // tested http://localhost:8080/search?q=hey&uid=4d94501d1f78ac091dbc9b4d (profile feed filter)
      //     => { q: 'hey', uId: '4d94501d1f78ac091dbc9b4d' }
    } else if (q.excludeUid) {
      q = {
        q: q.q,
        uId: '-' + q.excludeUid,
      };
      return searchIndex.search(
        'posts',
        q,
        options,
        makeCallbackTranslator('post', cb),
      );
      // tested http://localhost:8080/search?q=adrien&context=quick
      //     => { q: 'adrien', excludeUid: '4d94501d1f78ac091dbc9b4d', limit: 10 }
      // tested http://localhost:8080/search?q=pouet&context=addTrack
      //     => { q: 'pouet', excludeUid: '4d94501d1f78ac091dbc9b4d', limit: 10 }
    } else {
      return searchIndex.search(
        'posts',
        q.q,
        options,
        makeCallbackTranslator('post', cb),
      );
      // tested http://localhost:8080/search?q=pouet&context=header
      //     => { q: 'pouet' }
    }
  },
  playlist: function (q, cb) {
    console.log('[search] search playlists', q);
    const options = extractOptions(q);
    return searchIndex.search(
      'playlists',
      q.q,
      options,
      makeCallbackTranslator('playlist', cb),
    );
    // tested http://localhost:8080/search?q=pouet&context=header
    //     => { q: 'pouet' }
  },
};

exports.query = function (q = {}, cb) {
  let hits = [];
  let queue;
  if (q._type) queue = [q._type];
  else if (q.uId) queue = ['post'];
  else queue = ['user', 'track', 'post', 'playlist']; //Object.keys(searchByType);
  delete q._type;
  (function next() {
    const type = queue.pop();
    if (!type) cb({ q: q.q, hits: hits });
    else
      searchByType[type](q, function (res) {
        if (res.hits) {
          console.log(
            '[search] searchAlgolia.query =>',
            res.hits.length,
            'hits',
          );
          hits = hits.concat(res.hits);
        } else {
          console.error(
            '[search] algolia error for ' +
              JSON.stringify(q, null, 2) +
              ' => ' +
              JSON.stringify(res, null, 2),
          );
        }
        next();
      });
  })();
};

function logToConsole(e) {
  console.trace('[search] INDEX ERROR: ' + (e || {}).error);
}

function indexTypedDocs(type, items, callback) {
  console.log('[search] indexTypedDocs', type, items.length, '...');
  if (!type || !INDEX_NAME_BY_TYPE[type]) {
    callback && callback(new Error('indexTyped: unknown type'));
  } else {
    const docs = items.map(function (item) {
      if (!item || !item._id || !item.name) {
        logToConsole({ error: 'indexTypedDocs: missing parameters' });
      }
      // filter fields to be indexed
      const doc = { objectID: item._id };
      FIELDS_BY_TYPE[type].forEach(function (field) {
        doc[field] = item[field];
      });
      return doc;
    });

    getIndex(INDEX_NAME_BY_TYPE[type])
      .saveObjects(docs, { autoGenerateObjectIDIfNotExist: true })
      .wait()
      .catch((err) => {
        console.error(
          '[search] algolia error when indexing ' +
            items.length +
            ' ' +
            type +
            ' items => ' +
            err.toString(),
        );
        callback && callback(err);
      })
      .then(() => {
        console.log(
          '[search] algolia indexTyped ' + type + ' => indexed',
          items.length,
          'documents',
        );
        callback && callback(null, { items: items });
      });
  }
}

exports.indexTyped = function (type, item, handler) {
  //console.log("models.search.index(): ", item, "...");
  if (!item || !item._id || !item.name) {
    logToConsole({ error: 'indexTyped: missing parameters' });
    handler && handler(new Error('indexTyped: missing parameters'));
    return;
  }
  return indexTypedDocs(type, [item], function (err, success) {
    handler && handler(err, success);
  });
};

exports.countDocs = function (type, callback) {
  client
    .listIndices()
    .catch((err) => {
      console.error('[search]', err);
      callback(null);
    })
    .then(function (content) {
      try {
        const count = content.items.find(function (index) {
          return index.name === INDEX_NAME_BY_TYPE[type];
        }).entries;
        callback(count);
      } catch (e) {
        console.error('[search]', e);
        callback(null);
      }
    });
};

exports.deleteAllDocs = function (type, callback) {
  if (!INDEX_NAME_BY_TYPE[type]) {
    callback && callback(new Error('invalid type'));
    return;
  }
  getIndex(INDEX_NAME_BY_TYPE[type])
    .clearObjects()
    .wait()
    .catch((err) => {
      callback && callback(err);
    })
    .then(() => {
      callback && callback(); // TODO: check if parameters are required or not
    });
};

exports.indexBulk = function (docs, callback) {
  console.log('[search] indexBulk', docs.length, '...');
  const docsPerType = {};
  docs.forEach(function (doc) {
    docsPerType[doc._type] = (docsPerType[doc._type] || []).concat([doc]);
  });
  const typeToBeIndexed = Object.keys(docsPerType).find(function (type) {
    console.log('[search] docsPerType', type, ':', docsPerType[type].length);
    return docsPerType[type].length > 0;
  });
  // TODO: also index from other types
  return indexTypedDocs(
    typeToBeIndexed,
    docsPerType[typeToBeIndexed],
    function (err, res) {
      callback({
        error: err,
        items: (res || {}).items,
      });
    },
  );
};

// INIT

exports.init = function () {
  //console.log("[search] using Algolia Search index");
};
