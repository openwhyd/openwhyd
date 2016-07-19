/**
 * plContest model
 * playlist contests
 * @author: adrienjoly, whyd
 **/

var snip = require("../snip.js");
var mongodb = require("../models/mongodb.js");
var searchModel = require("../models/search.js");

function titleToURI(title) {
	return snip.removeAccents(title.toLowerCase()).replace(/[^a-z0-9]+/g, " ").trim().replace(/ /g, "_");
}
/*
var TEST_TITLES = [
	"Coca-Cola's playlist contest #2013",
	" t e s t ",
	".-!?ç$%^hey&@(§)"
];
for (var i in TEST_TITLES)
	console.log('TEST_TITLES', TEST_TITLES[i], titleToURI(TEST_TITLES[i]));
*/

exports.save = function(p, render) {
	if (!p.loggedUser)
		return render({error: "please log in first"});
	if (!p.uId && !mongodb.usernames[p.uId])
		return render({error: "organizer not found"});
	var plC = {
		title: p.title,
		uId: p.uId,
		url: p.url,
		uri: titleToURI(p.title)
	};
	console.log("saving playlist contest", plC);
	//render(plC);
	mongodb.collections["plContest"].insert(plC, function(err, result){
		render((result && result.length ? result[0] : result) || {error: err});
	});
}

exports.fetchOne = function(uri, cb) {
	mongodb.collections["plContest"].findOne({uri:uri}, function(err, result){
		cb(result || {error: err});
	});	
}

exports.fetchLast = function(cb) {
	mongodb.collections["plContest"].find({}, {sort:[["_id", "desc"]], limit:1}, function(err, cursor){
		cursor.toArray(function(err, results){
			cb(results.pop() || {error: err});
		});
	});	
}

exports.fetchByTitle = function(title, cb) {
	mongodb.collections["plContest"].findOne({title:title}, function(err, result){
		cb(result || {error: err});
	});	
}

exports.fetchById = function(id, cb) {
	mongodb.collections["plContest"].findOne({_id:mongodb.ObjectId(""+id)}, function(err, result){
		cb(result || {error: err});
	});	
}

exports.fetch = function(cb) {
	/*function translateHit(item){
		return {
			id: item._id,
			name: item.name
		};
	}*/
	mongodb.collections["plContest"].find({}, {sort:[["_id", "desc"]]}, function(err, cursor){
		cursor.toArray(function(err, contests){
			var i = contests.length;
			(function fetchNextContextPlaylists() {
				if (--i < 0)
					cb(contests || {error: err});
				else {
					var contest = contests[i];
					console.log("looking for participants of", contest.title, "...");
					searchModel.query({q:contest.title}, function(r) {
						contest.playlists = [];
						var hits = (r || {}).hits || [];
						for (var j in hits)
							if (hits[j]._type == "playlist" && hits[j].name == contest.title)
								contest.playlists.push(hits[j]._id);
						console.log("=> participating playlists:", contest.title, ":", contest.playlists.length);
						fetchNextContextPlaylists();
					});
				}
			})();
		});	
	});
}

