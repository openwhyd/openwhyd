/**
 * solrIndex model
 * @author adrienjoly, whyd
 * @deprecated because this code has not been used for years
 **/

const http = require('http');

const host = process.env['SOLR_HOST'] || 'localhost';
const port = process.env['SOLR_PORT'] || 8983;

const queryPath = '/solr/select/';
const updatePath = '/solr/update/json?wt=json&commit=true';

const DEFAULT_BOOST = 10000;

exports.request = function (path, data, callback) {
  const req = http.request(
    {
      path: path,
      host: host,
      port: port,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-type': 'application/json',
        Accept: 'application/json',
      },
    },
    function (res) {
      let resData = '';
      res.addListener('data', function (chunk) {
        resData += chunk.toString();
      });
      res.addListener('end', function () {
        //console.log("solr request status code:", res.statusCode);
        //console.log("solr request response:", resData);
        if (callback) callback(resData, res.statusCode);
      });
    },
  );
  //req.setHeader('Content-type', 'application/json');
  //req.setHeader('Accept', 'application/json');
  req.addListener('error', function (err) {
    console.trace('solrIndex.request socket error: ', err);
    if (callback) callback({ error: err });
  });
  if (data) {
    if (typeof data == 'object') req.write(JSON.stringify(data));
    else req.write('' + data);
  }
  req.end();
};

exports.query = function (args = {}, callback) {
  const path =
    queryPath +
    '?version=2.2&wt=json&start=0&rows=' +
    (args.limit || 10) +
    '&q=' +
    encodeURIComponent(args.q || '');
  exports.request(path, null, function (data) {
    try {
      if (callback) callback(JSON.parse(data));
    } catch (e) {
      console.log(e.stack);
      if (callback) callback({ error: e });
    }
  });
};

const noOp = () => {
  /* nothing to do */
};

// doc = { id: "whyd", name: "whyd" }
exports.addDoc = function (doc, callback = noOp) {
  console.log('solrIndex.addDoc: ', doc);
  exports.request(
    updatePath,
    { add: { doc: doc, boost: DEFAULT_BOOST } },
    function (data, statusCode) {
      try {
        if (statusCode != 200) callback({ error: data });
        else callback(JSON.parse(data));
      } catch (e) {
        console.log(e.stack);
        callback({ error: e });
      }
    },
  );
};
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
//curl $URL -H 'Content-type:application/json' -d '
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
  console.log('models.search: SolrIndex client on', host, port);
};
