/**
 * LibFriends class
 * fetchs and renders a user's friends library
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
var postModel = require('../models/post.js');
var followModel = require('../models/follow.js');
var activityModel = require('../models/activity.js');
var contestModel = require('../models/plContest.js');
var feedTemplate = require('../templates/feed.js');

var HISTORY_LIMIT = 3;

function fetchSubscriptions(uid, callback) {
  //console.time("LibFriends.fetchSubscriptions");
  followModel.fetchSubscriptionArray(uid, function (subscriptions) {
    //console.timeEnd("LibFriends.fetchSubscriptions");
    callback(subscriptions.concat([uid]));
  });
}

function fetchRecentActivity(uidList, loggedUid, cb) {
  /* // test case
	cb([
		{id:"4d94501d1f78ac091dbc9b4d", name:"Adrien Joly", subscription: {
			id:"4fb118c368b1a410ecdc0058", name:"Tony Hymes"
		}}
	]);
	return;*/
  var subscribers = [];
  for (let i in uidList)
    if (uidList[i] != loggedUid) subscribers.push(uidList[i]);
  activityModel.fetchHistoryFromUidList(
    /*uidList*/ subscribers,
    { limit: HISTORY_LIMIT },
    function (activities) {
      cb(activities /*.slice(0, HISTORY_LIMIT)*/);
    }
  );
}

function prepareSidebar(uidList, options, cb) {
  if (!options.after && !options.before && options.format != 'json') {
    /*
		fetchSuggestedPeople(uidList, function(userList) {
			if (userList && userList.length)
				options.suggestedUsers = { items: userList };
		*/
    //console.time("fetchRecentActivity");
    fetchRecentActivity(uidList, options.loggedUser.id, function (activities) {
      //console.timeEnd("fetchRecentActivity");
      if (activities && activities.length)
        options.recentActivity = { items: activities };
      //console.time("fetchLast");
      contestModel.fetchLast(function (contest) {
        //console.timeEnd("fetchLast");
        if (config.advertisePlaylistContestOnHome && contest && contest.title)
          options.playlistContest = contest;
        cb();
      });
    });
    /*
		});
		*/
  } else cb();
}

function renderFriendsFeed(options, callback) {
  var params = {
    after: options.after,
    before: options.before,
    //limit:limit
  };
  if (options.limit) params.limit = options.limit;

  fetchSubscriptions(options.loggedUser.id, function (uidList, subscriptions) {
    options.subscriptions = subscriptions;
    postModel.fetchByAuthors(uidList, params, function (posts) {
      prepareSidebar(uidList, options, function () {
        // (if necessary), then:
        feedTemplate.renderFeedAsync(posts, options, callback);
      });
    });
  });
}

function renderFriendsLibrary(lib) {
  var options = lib.options;
  options.bodyClass = 'pgStream pgWithSideBar';
  options.homeFeed = true;
  options.displayPlaylistName = true;

  renderFriendsFeed(options, function (res) {
    if (options.format == 'json') lib.renderJson(res);
    else if (options.after || options.before) lib.render({ html: res });
    else {
      var /*options.mixpanelCode*/ feedHtml =
          [
            '<script>',
            ' window.Whyd.tracking.log("Visit home");',
            '</script>',
            '',
          ].join('\n') + res;
      lib.renderPage({ name: 'Dashboard' }, /*sidebarHtml*/ null, feedHtml);
    }
  });
}

exports.render = renderFriendsLibrary;
