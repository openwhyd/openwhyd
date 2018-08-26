/**
 * solrIndex model
 * @author adrienjoly, whyd
 **/

var http = require('http')

var host = process.env['SOLR_HOST'] || 'localhost'
var port = process.env['SOLR_PORT'] || 8983

var queryPath = '/solr/select/'
var updatePath = '/solr/update/json?wt=json&commit=true'
// var commitPath = "/solr/update/json?wt=json?commit=true";

var DEFAULT_BOOST = 10000

exports.request = function (path, data, callback) {
  var req = http.request({
    path: path,
    host: host,
    port: port,
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-type': 'application/json',
      'Accept': 'application/json'
    }
  }, function (res) {
    var resData = ''
    res.addListener('data', function (chunk) {
      resData += chunk.toString()
    })
    res.addListener('end', function () {
      // console.log("solr request status code:", res.statusCode);
      // console.log("solr request response:", resData);
      if (callback) { callback(resData, res.statusCode) }
    })
  })
  // req.setHeader('Content-type', 'application/json');
  // req.setHeader('Accept', 'application/json');
  req.addListener('error', function (err) {
    console.log('solrIndex.request socket error: ', err)
    if (callback) { callback({error: err}) }
  })
  if (data) {
    if (typeof data === 'object') { req.write(JSON.stringify(data)) } else { req.write('' + data) }
  }
  req.end()
}

exports.query = function (args, callback) {
  var args = args || {}
  var path = queryPath + '?version=2.2&wt=json&start=0&rows=' + (args.limit || 10) + '&q=' + encodeURIComponent(args.q || '')
  exports.request(path, null, function (data) {
    try {
      if (callback) { callback(JSON.parse(data)) }
    } catch (e) {
      console.log(e.stack)
      if (callback) { callback({error: e}) }
    }
  })
}

// doc = { id: "whyd", name: "whyd" }
exports.addDoc = function (doc, callback) {
  var callback = callback || function () {}
  console.log('solrIndex.addDoc: ', doc)
  exports.request(updatePath, {'add': {'doc': doc, 'boost': DEFAULT_BOOST}}, function (data, statusCode) {
    try {
      if (statusCode != 200) { callback({error: data}) } else { callback(JSON.parse(data)) }
    } catch (e) {
      console.log(e.stack)
      callback({error: e})
    }
  })
}
/*
exports.removeDoc = function(query, callback) {
	var callback = callback || function(){};
	console.log("solrIndex.removeDoc: ", query);
	if (!query || !query.id) {
		console.log("solrIndex.removeDoc ERROR: invalid query", query);
		callback({error:"invalid query"});
		return;
	}
	exports.request(updatePath, {"delete":query}, function(data, statusCode){
		try {
			if (statusCode != 200)
				callback({error:data})
			else
				callback(JSON.parse(data));
		}
		catch (e) {
			console.log(e.stack);
			callback({error:e});
		}
	});
}
*/
// curl $URL -H 'Content-type:application/json' -d '
/*
exports.commit = function(callback) {
	console.log("solrIndex.commit");
	exports.request(commitPath, null, function(data){
		console.log("commit result:",data);
		if (callback)
			callback(data);
	});
}
*/

// INIT

exports.init = function () {
  console.log('models.search: SolrIndex client on', host, port)
}
