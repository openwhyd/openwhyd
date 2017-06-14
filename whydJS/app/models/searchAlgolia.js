/**
 * Wraps search requests to algolia index
 * @author adrien joly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('./mongodb.js');
var Algolia = require('algoliasearch');

var ENGINE = new Algolia(process.env.ALGOLIA_APP_ID.substr(), process.env.ALGOLIA_API_KEY.substr());

var INDEX_NAME_BY_TYPE = {
	user: 'users',
	track: 'tracks',
	post: 'posts',
	playlist: 'playlists',
};

// lazy init and caching of indexes
var getIndex = (function() {
	var INDEX = {}; // cache of indexes
	var INDEX_FIELDS = {
		users: [ 'email', 'handle' ],
		posts: [ 'text', 'uId' ],
		playlists: [ ],
	};
	return function(indexName) {
		var index = INDEX[indexName];
		if (!index) {
			index = INDEX[indexName] = ENGINE.initIndex(indexName);
			// init field indexing settings
			var fields = INDEX_FIELDS[indexName] || [];
			index.setSettings({
				attributesForFaceting: [ 'name' ].concat(fields.map(function(field) {
					return 'filterOnly(' + field + ')';
				}))
			});
		}
		return index;
	}
})();

function Search() {}

Search.prototype.search = function(index, query, options, cb) {  
  var facetAttrs = [];
  var facetFilters = [];
  var i, q;
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
  if (cb) {
    if (this.queries) {
      options.index = index;
      options.query = q;  
      this.queries.push(options);
      ENGINE.multipleQueries(this.queries, 'index', cb);
    } else {
      getIndex(index).search(q, options, cb);
    }
  } else {
    options.index = index;
    options.query = q;
    this.queries = this.queries || [];
    this.queries.push(options);
  }
  return this;
};

function makeCallbackTranslator(type, cb){
	function translateResult(r){
		r._type = type;
		r._id = r.objectID.replace(":", "_");
		delete r.objectID;
		return r;
	}
	return function(err, res){
		if (err)
			cb({error: err});
		else {
			res.hits = res.hits.map(translateResult);
			cb(res);
		}
	};
}

var FIELD_MAPPING = {
	limit: "hitsPerPage",
};

function extractOptions(q){
	return snip.filterFields(q, FIELD_MAPPING);
}

var searchIndex = new Search();

var searchByType = {
	"user": function(q, cb){
		console.log("search users", q);
		var options = extractOptions(q);
		return searchIndex.search("users", q.q, options, makeCallbackTranslator("user", cb));
		// tested http://localhost:8080/search?q=adrien&context=mention
		//     => { q: 'adrien', limit: 6 }
		// tested http://localhost:8080/search?q=pouet&context=header
		//     => { q: 'pouet' }
	},
	"track": function(q, cb){
		console.log("search tracks", q);
		var options = extractOptions(q);
		return searchIndex.search("tracks", q.q, options, makeCallbackTranslator("track", function(res){
			(res.hits || []).map(function(h){
				h.eId = h._id;
				h._id = mongodb.ObjectId(h.post);
				delete h.post;
			});
			cb(res);
		}));
	},
	"post": function(q, cb){
		console.log("search posts", q);
		var options = extractOptions(q);
		if (q.uId) {
			q = {
				q: q.q,
				uId: q.uId,
			};
			return searchIndex.search("posts", q, options, makeCallbackTranslator("post", cb));
			// tested http://localhost:8080/search?q=adrien&context=quick
			//     => { q: 'adrien', uId: '4d94501d1f78ac091dbc9b4d', limit: 10 }
			// tested http://localhost:8080/search?q=hey&uid=4d94501d1f78ac091dbc9b4d (profile feed filter)
			//     => { q: 'hey', uId: '4d94501d1f78ac091dbc9b4d' }
		}
		else if (q.excludeUid) {
			q = {
				q: q.q,
				uId: "-" + q.excludeUid,
			};
			return searchIndex.search("posts", q, options, makeCallbackTranslator("post", cb));
			// tested http://localhost:8080/search?q=adrien&context=quick
			//     => { q: 'adrien', excludeUid: '4d94501d1f78ac091dbc9b4d', limit: 10 }
			// tested http://localhost:8080/search?q=pouet&context=addTrack
			//     => { q: 'pouet', excludeUid: '4d94501d1f78ac091dbc9b4d', limit: 10 }
		}
		else {
			return searchIndex.search("posts", q.q, options, makeCallbackTranslator("post", cb));
			// tested http://localhost:8080/search?q=pouet&context=header
			//     => { q: 'pouet' }
		}
	},
	"playlist": function(q, cb){
		console.log("search playlists", q)
		var options = extractOptions(q);
		return searchIndex.search("playlists", q.q, options, makeCallbackTranslator("playlist", cb));
		// tested http://localhost:8080/search?q=pouet&context=header
		//     => { q: 'pouet' }
	},
};

exports.query = function(q, cb) {
	var hits = [];
	var q = q || {};
	var queue;
	if (q._type)
		queue = [q._type];
	else if (q.uId)
		queue = ["post"];
	else
		queue = ["user", "track", "post", "playlist"]; //Object.keys(searchByType);
	delete q._type;
	(function next(){
		var type = queue.pop();
		if (!type)
			cb({q: q.q, hits: hits});
		else
			searchByType[type](q, function(res){
				if (res.hits) {
					console.log("=>", res.hits.length, "hits")
					hits = hits.concat(res.hits);
				} else {
					console.error("algolia error for " + JSON.stringify(q, null, 2)
					  + " => " + JSON.stringify(res, null, 2));
				}
				next();
			});
	})();
}

exports.indexTyped = function(type, item, handler) {
	//console.log("models.search.index(): ", item, "...");
	if (!type || !INDEX_NAME_BY_TYPE[type])
		handler || logToConsole({error: "indexTyped: unknown type"});
	else if (!item || !item._id || !item.name)
		handler || logToConsole({error: "indexTyped: missing parameters"});
	else {
		var doc = Object.assign({ objectID: item._id }, item);
		delete doc._id;
		getIndex(INDEX_NAME_BY_TYPE[type]).addObjects([ doc ], function(err, content) {
			if (err) {
				console.error("algolia error when indexing " + type + " " + JSON.stringify(item, null, 2)
					+ " => " + JSON.stringify(err, null, 2))
			} else {
				console.log("algolia indexTyped " + type + " =>", content);
			}
			handler && handler(); // TODO: check if parameters are required or not
		});
	}
}

exports.countDocs = function(type, callback) {
	ENGINE.listIndexes(function(err, content) {
		try {
			callback(content.items.find(function(index) {
				return index.name === INDEX_NAME_BY_TYPE[type];
			}).entries);
		} catch(e) {
			console.error(err || e);
			callback(null);
		}
	});
}

exports.deleteAllDocs = function(type, callback) {
	getIndex(INDEX_NAME_BY_TYPE[type]).clearIndex(function(err, content) {
		console.log('algolia deleteAllDocs =>', err || content);
		callback && callback(); // TODO: check if parameters are required or not
	});
}

// INIT

exports.init = function(){
	console.log("models.search: using Algolia Search index");
}
