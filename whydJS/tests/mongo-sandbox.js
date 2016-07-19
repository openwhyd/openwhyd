/**
 * mongodb sandbox
 * @author adrienjoly, whyd
 **/

GLOBAL.DEBUG = true;

sys = require("sys");
util = require('util');

var nodepath = "./node_modules/";

var Db = require(nodepath+'node-mongodb-native/lib/mongodb').Db,
	Connection = require(nodepath+'node-mongodb-native/lib/mongodb').Connection,
	Server = require(nodepath+'node-mongodb-native/lib/mongodb').Server,
	BSON = require(nodepath+'node-mongodb-native/lib/mongodb').BSONPure;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

//var dbname = "test"; 
var dbname = "whyd_freebase";

var db = new Db(dbname, new Server(host, port, {auto_reconnect:true}), {native_parser:false /*, strict:true*/});

util.log('MongoDB client module is starting...');
sys.puts("Connecting to MongoDB/"+dbname+" @ " + host + ":" + port + "...");

	
db.open(function(err, db)
{
	if (err) throw err;
	sys.puts("Successfully connected to MongoDB/"+dbname+" @ " + host + ":" + port);
	
	function coll (tableName, handler)
	{
		db.collection(tableName, function(err, collection) {
			//if (collection) sys.puts("Connected to table : " + tableName);
			if (err) sys.puts("MongoDB Error : " + err);
			else handler(err, collection);
		});
	}
	
	function listTables ()
	{
		// diagnostics
		db.collections(function(err, collections) {
			if (err) sys.puts("MongoDB Error : " + err);
			else
				for (var i in collections)
				{
					var queryHandler = function() {
						var table = collections[i].collectionName;
						return function(err, result) {
							console.log(" - found table: " + table + " : " + result + " rows");
						};
					}();
					collections[i].count(queryHandler);
				}
		});
	}
	
	function upsertTest ()
	{
		coll("upsert", function(err, col) {
			console.log("upserting...");
			var obj = {coco:1,yop:2};
			col.update(obj, obj, {upsert: true});
		});
	}
	
	var BinaryParser = require(nodepath + 'node-mongodb-native/lib/mongodb/bson/binary_parser').BinaryParser
	
	function getFirstTimestamp ()
	{
		coll("fav", function(err, col) {
			console.log("getting time of fav");
			col.findOne({}, function(err,item){
				console.log(item);
				console.log("timestamp", item._id.generationTime, new Date(item._id.generationTime));
			});
		});
	}
	
	function favToStatus()
	{
		var status = {}; // uId+tId -> {_id, uId, uNm, tId, tNm, text, content[{id,name}]}
		
		coll("fav", function(err, col) {
			col.find({}, function(err, cursor){
				cursor.each(function(err, fav) {
					if (fav == null) {
						console.log("\n", status);
						coll("status", function(err, dest) {
							for (var i in status)
								dest.save(status[i]);
						});
						return;
					}
					var statusId = fav.uId + fav.tId;
					var s = status[statusId];
					if (!s) {
						s = {_id: fav._id, uId: fav.uId, uNm: fav.uNm, tId: fav.tId, tNm: fav.tNm, content:[]};
						s.text = s.tNm + " by " + s.uNm;
					}
					s.content.push({id: fav.fId, name: fav.fNm});
					status[statusId] = s;
				});
			});
		});
	}
	
	function getIdFromInsert() {
		coll("topic", function(err, col) {
			console.log("insert...");
			var obj = {coco:1,yop:2};
			console.log ("obj", obj);
			col.insert(obj, function(err, obj2) {
				console.log ("err", err);
				console.log ("obj", obj);
				console.log ("obj2", obj2);
				// => both contain a _id field
			});
		});
	}
	
	getIdFromInsert();
	return;
});




