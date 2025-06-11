/**
 * recentActivity controller
 * shows an history of friend's activity (subscriptions etc...)
 * @author adrienjoly, whyd
 **/

const snip = require('../snip.js');
const ObjectId = require('../models/mongodb.js').ObjectId;
const followModel = require('../models/follow.js');
const activityModel = require('../models/activity.js');
const postModel = require('../models/post.js');
const userModel = require('../models/user.js');
const postsTemplate = require('../templates/posts.js');
const templateLoader = require('../templates/templateLoader.js');
const mainTemplate = require('../templates/mainTemplate.js');

let template;
function loadTemplates(callback) {
  template = templateLoader.loadTemplate(
    'app/templates/recentActivity.html',
    function () {
      if (callback) callback();
    },
  );
}
loadTemplates();

const fetchSubscriptions = function (uid, callback) {
  const uidList = [];
  //console.log("recentActivity.fetchSubscriptions", uid);
  followModel.fetchUserSubscriptions(uid, function (subscriptions) {
    for (const i in subscriptions.subscriptions)
      if (
        subscriptions.subscriptions[i].id &&
        subscriptions.subscriptions[i].id != uid
      )
        uidList.push(
          ('' + subscriptions.subscriptions[i].id).replace('/u/', ''),
        );
    //console.log("LibFriends.fetchSubscriptions => ", uidList ? uidList.length : null);
    callback(uidList, subscriptions);
  });
};

function fetchRecentActivity(uidList, mySubscriptionsUidList, options, cb) {
  /*  // test case
	return cb([
		{id:"4d94501d1f78ac091dbc9b4d", name:"Adrien Joly", subscription: {
			id:"4fb118c368b1a410ecdc0058", name:"Tony Hymes", subscribed: true
		}}
	]); */
  const uidSet = {};
  for (const i in mySubscriptionsUidList)
    uidSet[mySubscriptionsUidList[i]] = true;
  //options = options || {};
  //uidList.push("4d94501d1f78ac091dbc9b4d"); // adrien (for tests)

  //console.log("uidList:", uidList);

  activityModel.fetchHistoryFromUidList(
    uidList,
    options,
    function (activities, hasMore) {
      // extract users and posts to fetch from DB

      const usersToPopulate = [],
        postsToPopulate = [];
      for (const i in activities)
        if ((activities[i] || {}).subscription) {
          activities[i].subscription.subscribed =
            uidSet[activities[i].subscription.id];
          usersToPopulate.push(activities[i].subscription);
        } else if ((activities[i] || {}).like)
          postsToPopulate.push(ObjectId('' + activities[i].like.pId));

      // fetch users and posts from DB

      userModel.fetchUserBios(usersToPopulate, function () {
        postModel.fetchPosts(
          { _id: { $in: postsToPopulate } },
          /*params*/ null,
          /*options*/ null,
          function (posts) {
            // apply fetched data (when not null) to liked posts
            const postSet = {},
              finalActivities = [];
            for (const i in posts) postSet['' + posts[i]._id] = posts[i];
            for (const i in activities) {
              if ((activities[i] || {}).like) {
                if (postSet['' + activities[i].like.pId])
                  activities[i].like.post =
                    postSet['' + activities[i].like.pId];
                else continue; // do not keep null posts
              }
              finalActivities.push(activities[i]);
            }
            cb(finalActivities, hasMore);
          },
        );
      });
    },
  );
}

function aggregateActivities(acts) {
  //console.log("acts", acts);
  const aggrs = [];
  let aggr = {};
  for (const i in acts) {
    const attrName = (acts[i].type = acts[i].like ? 'like' : 'subscription'),
      sameAuthor = aggr.id == acts[i].id,
      sameActType = aggr.type == acts[i].type;
    if (sameAuthor && sameActType)
      aggr[attrName + 's'].aggregatedItems.push(acts[i][attrName]);
    else {
      // acts[i] is the first activity of this type / author => to be aggregated
      acts[i][attrName + 's'] = { aggregatedItems: [acts[i][attrName]] };
      aggrs.push((aggr = acts[i]));
    }
  }
  //console.log("aggrs", aggrs);
  return aggrs;
}

async function renderLikedPosts(activity, cb) {
  if (activity.type == 'like') {
    const posts = await Promise.all(
      activity.likes.aggregatedItems.map(function (aggr) {
        return postsTemplate.preparePost(aggr.post);
      }),
    );
    //if (!posts.length) continue;
    activity.likes.nbTracks =
      posts.length > 1 ? posts.length + ' tracks' : 'one track';
    postsTemplate.renderPostsAsync(posts, {}, function (postsHtml) {
      activity.likes.posts = postsHtml;
      cb();
    });
  } else cb();
}

exports.generateActivityFeed = function (
  uidList,
  mySubscriptionsUidList,
  reqParams,
  cb,
) {
  fetchRecentActivity(
    uidList,
    mySubscriptionsUidList,
    { after: reqParams.after },
    function (rawActivities, hasMore) {
      const activities = aggregateActivities(rawActivities);

      snip.forEachArrayItem(activities, renderLikedPosts, function () {
        cb({
          recentActivity: { items: activities },
          rawFeed: reqParams.after || reqParams.before,
          hasMore: hasMore
            ? { last_id: (rawActivities[rawActivities.length - 1] || {})._id }
            : null,
        });
      });
    },
  );
};

exports.controller = async function (request, reqParams, response) {
  request.logToConsole('recentActivity.controller', reqParams);
  reqParams = reqParams || {};
  const loggedInUser = (await request.getUser()) || {};
  if (!loggedInUser.id) return response.temporaryRedirect('/');

  //reqParams.loggedUser.isAdmin = request.isUserAdmin(loggedInUser);

  function render(html) {
    response.legacyRender(html, null, { 'content-type': 'text/html' });
  }

  fetchSubscriptions(loggedInUser.id, function (uidList) {
    if (uidList.length > 5000) {
      console.trace(
        `potential expensive activity query, for user ${loggedInUser.id}, uidList length: ${uidList.length}`,
      );
      console.time(`recentActivityController_${loggedInUser.id}`);
    }

    exports.generateActivityFeed(
      uidList,
      uidList,
      reqParams,
      function (pageVars) {
        if (uidList.length > 5000) {
          console.timeEnd(`recentActivityController_${loggedInUser.id}`);
        }
        if (!pageVars.rawFeed) {
          const fullUidList = uidList.slice(0, uidList.length);
          fullUidList.push(loggedInUser.id);
          render(
            mainTemplate.renderWhydPage({
              bodyClass: 'pgRecentActivity pgWithSideBar',
              loggedUser: loggedInUser,
              content: template.render(pageVars),
            }),
          );
        } else {
          render(template.render(pageVars));
        }
      },
    );
  });
};
