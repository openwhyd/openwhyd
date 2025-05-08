/**
 * analytics console
 * @author adrienjoly, whyd
 **/

const mongodb = require('../../models/mongodb');
const userModel = require('../../models/user');
//var followModel = require("../../models/follow");
const mainTemplate = require('../../templates/mainTemplate');

function renderTemplate(report) {
  const params = { title: 'whyd analytics', css: [], js: [] };

  let out = ['<h1>whyd analytics console</h1>', '► <a href="/">home</a>'].join(
    '\n',
  );

  out += '<table>';

  let p = 0;
  const color = ['lightgray', 'white'];

  for (const i in report)
    out +=
      "<tr  style='background:" +
      color[p++ % 2] +
      "'><td>" +
      i +
      '</td><td>' +
      report[i] +
      '</td></tr>';

  out += '</table>';

  return mainTemplate.renderWhydFrame(out, params);
}

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('analytics.controller', reqParams);

  if (!(await request.checkAdmin(response))) return;

  let users;
  const userIndex = {};

  const t0 = new Date();
  const report = { 'Report date': t0 };
  //t0 = t0.getTime();

  const populateUsers = function (callback) {
    userModel.fetchAll(function (usersP) {
      users = usersP;
      for (const i in users) {
        users[i].firstDate = users[i]._id.getTimestamp();
        userIndex['' + users[i]._id] = users[i];
      }
      report['Number of users'] = users.length;
      callback();
    });
  };

  /*
	var countRecomFollows = function (callback) {
		mongodb.collections['follow'].countDocuments({recom:true}, function(err,count) {
			report["Number of recommended topics followed"] = count;
			report["Average number of recommended topics followed by user"] = count / users.length;
			callback();
		});
	};

	var follows = null;

	var fetchFollows = function (callback) {
		if (follows) return callback(follows);

		console.log("fetching follow collection...");

		mongodb.collections['follow'].find({recom:{$exists:false}}, function(err, cursor) {
			console.log("done fetching follow collection.");
			cursor.toArray( function(err, items) {
				report["Number of topics followed"] = items.length;
				callback(follows = items);
			});
		});
	}

	var countPeriodFollows = function (t1, t2, nameSuffix) {
		return function(callback) {
			var counter = 0;
			for (let i in follows) {
				var item = follows[i];
				if (!userIndex[item.uId]) continue ; //console.log("user not found:",item.uId, item.uNm);
				//console.log(item);
				if (item._id.getTimestamp() >= userIndex[item.uId].firstDate + t1
					&& item._id.getTimestamp() < userIndex[item.uId].firstDate + t2)
					counter ++;
			}
			report["Average number of topics followed "+nameSuffix] = counter / users.length;
			callback();
		};
	};

	var countFirstDayFollows = countPeriodFollows(0, 24*60*60*1000, "on their first day");
	var countFirstWeekFollows = countPeriodFollows(0, 7*24*60*60*1000, "on their first week");
	var countFirstMonthFollows = countPeriodFollows(0, 30*24*60*60*1000, "on their first month");
	*/

  /*
	var posts = null;

	var fetchPosts = function (callback) {
		if (posts) return callback(posts);

		console.log("fetching status/post collection...");

		mongodb.collections['post'].find({}, function(err, cursor) {
			console.log("done fetching status/post collection.");
			cursor.toArray( function(err, items) {
				report["Number of posts"] = items.length;
				callback(posts = items);
			});
		});
	}

	var countPeriodActiveUsers = function (t1, t2, nameSuffix) {
		return function(callback) {
			var counter = 0, activeUsers = {};
			for (let i in posts) {
				var item = posts[i];
				if (!userIndex[item.uId]) continue ; //console.log("user not found:",item.uId, item.uNm);
				//console.log(item);
				if (!activeUsers[item.uId]
					&& item._id.getTimestamp() >= userIndex[item.uId].firstDate + t1
					&& item._id.getTimestamp() < userIndex[item.uId].firstDate + t2) {
					counter ++;
					activeUsers[item.uId] = true;
				}
			}
			report["Number of users that posted "+nameSuffix] = counter;
			callback();
		};
	};

	var countFirstDayPosts = countPeriodActiveUsers(0, 24*60*60*1000, "on their first day");

	var countPeriodPosts = function (t1, t2, nameSuffix) {
		return function(callback) {
			var counter = 0;
			for (let i in posts) {
				var item = posts[i];
				if (!userIndex[item.uId]) continue ; //console.log("user not found:",item.uId, item.uNm);
				//console.log(item);
				if (item._id.getTimestamp() >= t0 - t1
					&& item._id.getTimestamp() < t0 - t2) {
					counter ++;
				}
			}
			report["Number of posts "+nameSuffix] = counter;
			callback();
		};
	};

	var countTodayPosts = countPeriodPosts(24*60*60*1000, 0, "in the last 24 hours");
	var countWeekPosts = countPeriodPosts(7*24*60*60*1000, 0, "in the last 7 days");
	var countMonthPosts = countPeriodPosts(30*24*60*60*1000, 0, "in the last 30 days");
	*/

  // recent users

  const recentUserIds = {};

  function findUsersRegisteredAfter(date) {
    return function (cb) {
      for (const i in users)
        if (new Date(users[i].firstDate) >= date)
          recentUserIds[users[i]._id] = users[i];
      cb(
        'Number of users who registered after ' + date.toString(),
        Object.keys(recentUserIds).length,
      );
    };
  }

  // "invite" analytics

  let pendingInvites = null;

  const fetchPendingInvites = async function (callback) {
    console.log('fetching invite collection...');
    const items = await mongodb.collections['invite']
      .find({}, { limit: 999999 })
      .toArray();
    callback('Number of pending invites', (pendingInvites = items).length);
  };

  function countRecentInvites(cb) {
    let nb = 0;
    for (const i in users) if (users[i].lastFm) ++nb;
    cb('Number of lastfm users', nb);
  }

  function countLastfmUsers(cb) {
    let nbAccepted = 0,
      nbPending = 0;
    for (const uid in recentUserIds)
      if (recentUserIds[uid].iBy && recentUserIds[recentUserIds[uid].iBy])
        ++nbAccepted;
    for (const i in pendingInvites)
      if (pendingInvites[i].iBy && recentUserIds[pendingInvites[i].iBy])
        ++nbPending;
    report['Number of recent pending invites'] = nbPending;
    report['Number of recent accepted invites'] = nbAccepted;
    cb(/*"Number of recent invites (accepted + pending)", nbAccepted + nbPending*/);
  }

  // sequence of asynchronous calls to make

  const seq = [
    populateUsers,
    countLastfmUsers,
    /*
		countRecomFollows,
		fetchFollows,
		countFirstDayFollows,
		countFirstWeekFollows,
		countFirstMonthFollows,
		*/
    /*
		fetchPosts,
		countFirstDayPosts,
		countTodayPosts,
		countWeekPosts,
		countMonthPosts,
		*/
    fetchPendingInvites,
    findUsersRegisteredAfter(new Date('December 1, 2012 00:01')),
    countRecentInvites,
  ];

  (function runNext(reportLabel, reportValue) {
    if (reportLabel && reportValue != null) report[reportLabel] = reportValue;
    if (seq.length > 0) seq.shift()(runNext);
    else
      response.legacyRender(renderTemplate(report), null, {
        'content-type': 'text/html',
      });
  })();
};
