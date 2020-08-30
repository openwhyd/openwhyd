/**
 * Wraps search requests to elasticsearch index
 * @author adrien joly, whyd
 **/

var http = require('http');

var INDEX_NAME = 'whyd'; // "test";
var INDEX_HOST = 'localhost';
var INDEX_PORT = 9200;

var INDEX_FIELDS = {
  user: { _id: 1, name: 1, email: 1, handle: 1 },
  post: { _id: 1, name: 1, text: 1, uId: 1 },
  playlist: { _id: 1, name: 1 },
};

function buildReq(method, pathSuffix) {
  return {
    method: method || 'GET',
    host: INDEX_HOST,
    port: INDEX_PORT,
    path: '/' + INDEX_NAME + (pathSuffix || ''),
  };
}

function getJson(pathSuffix, cb) {
  return http
    .request(buildReq('GET', pathSuffix), function (res) {
      var json = '';
      res.addListener('data', function (chunk) {
        json += chunk.toString();
      });
      res.addListener('end', function () {
        try {
          json = JSON.parse(json);
        } catch (err) {
          json = { error: err };
          console.log(err);
        }
        cb(json);
      });
    })
    .addListener('error', function (err) {
      console.error('elasticsearch index getJson() socket error:', err);
      cb({ error: err });
    })
    .end();
}

function postJson(data = {}, cb) {
  var pathSuffix = '';
  if (data._type && data._id) {
    pathSuffix += '/' + data._type + '/' + data._id;
    delete data._type;
    delete data._id;
  }
  if (data._bulkStr) {
    pathSuffix += '/_bulk';
    data = data._bulkStr;
    console.log(
      'search.postJson BULK',
      pathSuffix,
      ':',
      data.length,
      'bytes...'
    );
  } else {
    if (data.query) pathSuffix += '/_search';
    console.log('search.postJson', pathSuffix, Object.keys(data));
    data = data && typeof data == 'object' ? JSON.stringify(data) : data;
  }

  //console.log("[INDEX] search request", data);

  return http
    .request(buildReq('POST', pathSuffix), function (res) {
      var json = '';
      res.addListener('data', function (chunk) {
        json += chunk.toString();
      });
      res.addListener('end', function () {
        //console.log("[INDEX] search response", json);

        try {
          json = JSON.parse(json);
        } catch (err) {
          json = { error: err };
          console.error(err);
        }
        cb(json);
      });
    })
    .addListener('error', function (err) {
      console.error('elasticsearch index postJson() socket error:', err);
      cb({ error: err });
    })
    .end(data);
}

exports.countDocs = function (type, cb) {
  console.log('models.search.countDocs():', type);
  // http://localhost:9200/twitter/tweet/_count
  getJson('/' + type + '/_count', function (response) {
    cb((response || {}).count);
  });
};

exports.deleteAllDocs = function (type, cb) {
  console.log('models.search.deleteAllDocs():', type);
  return http
    .request(buildReq('DELETE', '/' + type), function (res) {
      cb && res.addListener('end', cb);
    })
    .addListener('error', function (err) {
      console.error('elasticsearch socket error: ', err);
    })
    .end();
};

exports.deleteDoc = function (type, id, cb) {
  console.log('models.search.deleteDoc():', type, id);
  return http
    .request(buildReq('DELETE', '/' + type + '/' + id), function (res) {
      cb && res.addListener('end', cb);
    })
    .addListener('error', function (err) {
      console.error('elasticsearch socket error: ', err);
    })
    .end();
};
/*
exports.query = function(q, handler) {
	var q = ((""+q).trim().replace(/ +/g," ")+" ").split(" ").join("* ");
	getJson("/_search" + "?q=" + encodeURIComponent(q), function(response) {
		//console.log("json response", response);
		if (response && response.hits) {
			var hits = (response.hits || {}).hits;
			for (let i in hits) {
				if (hits[i] && hits[i]._source) {
					for (let j in hits[i]._source)
						hits[i][j] = hits[i]._source[j];
					delete hits[i]._source
				}
			}
			handler({q: q, hits: hits});
		}
		else
			handler(response);
	});
}
*/
exports.query = function (q = {}, handler) {
  var filter = [];

  if (q.uId) filter.push({ term: { uId: q.uId } });
  if (q.excludeUid) filter.push({ not: { term: { uId: q.excludeUid } } });

  if (q._type) filter.push({ term: { _type: q._type } });

  //console.log("filter", filter)

  /*
	var query = {
		match: {
			"name": {
				query: q.q,
				operator: "AND"
			}
		}
	};
	*/
  var query = {
    bool: {
      should: [
        { match: { name: { query: q.q, operator: 'AND' } } },
        { match: { full: { query: q.q, operator: 'AND' } } },
      ],
    },
  };

  if (q.uId) query.bool.should.push({ term: { text: q.q } });

  query = {
    query: {
      filtered: {
        query: query,
        filter: filter.length ? { and: filter } : [],
      },
    },
    from: q.from || 0,
    size: q.limit || 50,
    sort: q.sort || [{ _score: 'desc' }],
    facets: q.facets || {},
  };

  //console.log("query", query/*JSON.stringify(query)*/);

  postJson(query, function (response) {
    //console.log("json response", response);
    if (response && response.hits) {
      //console.log("hits", response.hits.hits);
      var hits = (response.hits || {}).hits;
      for (let i in hits) {
        if (hits[i] && hits[i]._source) {
          for (let j in hits[i]._source) hits[i][j] = hits[i]._source[j];
          delete hits[i]._source;
        }
      }
      handler({ q: q.q, hits: hits });
    } else handler(response);
  });
};

exports.index = function (doc, handler) {
  //console.log("models.search.index():", doc);
  postJson(doc, function (response) {
    console.log(
      'models.search.index() => ',
      (response || {}).ok ? 'OK' : 'ERROR'
    );
    handler && handler(response);
  });
};

exports.indexBulk = function (docs, cb) {
  console.log('indexBulk', docs.length, '...');
  var bulkStr = '';
  for (let i in docs) {
    var u = docs[i],
      meta = {},
      data = {};
    if (!u) {
      console.warn('ignoring empty doc from being indexed in BULK');
      continue;
    }
    for (let field in u)
      if (field[0] == '_') meta[field] = u[field];
      else data[field] = u[field];
    bulkStr +=
      JSON.stringify({ index: meta }) + '\n' + JSON.stringify(data) + '\n';
  }
  postJson({ _bulkStr: bulkStr }, cb);
};

function logToConsole(e) {
  console.log('INDEX ERROR: ' + (e || {}).error);
}

exports.indexTyped = function (type, item, handler) {
  //console.log("models.search.index(): ", item, "...");
  if (!type || !INDEX_FIELDS[type])
    handler || logToConsole({ error: 'indexTyped: unknown type' });
  else if (!item || !item._id || !item.name)
    handler || logToConsole({ error: 'indexTyped: missing parameters' });
  else {
    var doc = { _type: type };
    for (let f in INDEX_FIELDS[type]) doc[f] = item[f];
    this.index(doc, handler);
  }
};

exports.indexPlaylist = function (uid, plId, plName, handler) {
  var item = {
    //	_type: "playlist",
    _id: '' + uid + '_' + plId,
    name: plName,
  };
  //this.index(item, handler);
  this.indexTyped('playlist', item, handler);
};

exports.deletePlaylist = function (uid, plId, cb) {
  this.deleteDoc('playlist', '' + uid + '_' + plId, cb);
};

// tests:
//exports.index({_type:"user", _id:"007", name:"bond"});

// INIT

exports.init = function () {
  console.log(
    'models.search: initializing ElasticSearch index:',
    INDEX_HOST + ':' + INDEX_PORT + '/' + INDEX_NAME,
    '...'
  );
  try {
    exports.countDocs('user', function (c) {
      console.log('models.search: found', c, 'users in index');
    });
    exports.countDocs('post', function (c) {
      console.log('models.search: found', c, 'posts in index');
    });
    exports.countDocs('playlist', function (c) {
      console.log('models.search: found', c, 'playlists in index');
    });
  } catch (e) {
    console.error(e, 'error init search index');
  }
};
