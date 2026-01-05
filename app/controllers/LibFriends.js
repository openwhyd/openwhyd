/**
 * LibFriends class
 * fetchs and renders a user's friends library
 * @author adrienjoly, whyd
 **/

const postModel = require('../models/post.js');
const followModel = require('../models/follow.js');
// const activityModel = require('../models/activity.js');
const feedTemplate = require('../templates/feed.js');

// const HISTORY_LIMIT = 3;

function fetchSubscriptions(uid, callback) {
  //console.time("LibFriends.fetchSubscriptions");
  followModel.fetchSubscriptionArray(uid, function (subscriptions) {
    //console.timeEnd("LibFriends.fetchSubscriptions");
    callback(subscriptions.concat([uid]));
  });
}

// function fetchRecentActivity(uidList, loggedUid, cb) {
//   /* // test case
// 	cb([
// 		{id:"4d94501d1f78ac091dbc9b4d", name:"Adrien Joly", subscription: {
// 			id:"4fb118c368b1a410ecdc0058", name:"Tony Hymes"
// 		}}
// 	]);
// 	return;*/
//   const subscribers = [];
//   for (const i in uidList)
//     if (uidList[i] != loggedUid) subscribers.push(uidList[i]);

//   if (subscribers.length > 5000) {
//     console.trace(
//       `potential expensive activity query, for user ${loggedUid}, uidList length: ${subscribers.length}`,
//     );
//     console.time(`fetchRecentActivity_${loggedUid}`);
//   }

//   activityModel.fetchHistoryFromUidList(
//     /*uidList*/ subscribers,
//     { limit: HISTORY_LIMIT },
//     function (activities) {
//       if (uidList.length > 5000) {
//         console.timeEnd(`fetchRecentActivity_${loggedUid}`);
//       }

//       cb(activities /*.slice(0, HISTORY_LIMIT)*/);
//     },
//   );
// }

function prepareSidebar(uidList, options, cb) {
  cb(); // fetchRecentActivity() cause performance problems => we disable it for now.

  // if (
  //   feedTemplate.shouldRenderWholeProfilePage(options) &&
  //   options.format != 'json'
  // ) {
  //   const loggedUser = uidList[uidList.length - 1];
  //   console.time(`prepareSidebar_fetchRecentActivity_${loggedUser}`);
  //   fetchRecentActivity(uidList, options.loggedUser.id, function (activities) {
  //     console.timeEnd(`prepareSidebar_fetchRecentActivity_${loggedUser}`);
  //     if (activities && activities.length)
  //       options.recentActivity = { items: activities };
  //     //console.time("fetchLast");
  //     cb();
  //   });
  // } else cb();
}

function renderFriendsFeed(options, callback) {
  const params = {
    after: options.after,
    before: options.before,
    //limit:limit
  };
  if (options.limit) params.limit = options.limit;
  params.id = options.id ? options.id : options.loggedUser.id;
  console.log('options.id: ' + options.id);
  console.log('options.loggedUser.id: ' + options.loggedUser.id);
  console.log('params.id: ' + params.id);

  fetchSubscriptions(params.id, function (uidList, subscriptions) {
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
  const options = lib.options;
  options.bodyClass = 'pgStream pgWithSideBar';
  options.homeFeed = true;
  options.displayPlaylistName = true;

  renderFriendsFeed(options, function (res) {
    if (options.format == 'json') lib.renderJson(res);
    else if (!feedTemplate.shouldRenderWholeProfilePage(options))
      lib.render({ html: res });
    else {
      const /*options.mixpanelCode*/ feedHtml =
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
