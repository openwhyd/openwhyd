/**
 * discover controller (inspired by onboarding)
 * @author adrienjoly, whyd
 */

var get = require('../lib/get');
var snip = require('../snip.js');
var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
//var recomModel = require("../models/recom.js");
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');
var analytics = require('../models/analytics.js');

var templateLoader = require('../templates/templateLoader.js');
var mainTemplate = require('../templates/mainTemplate.js');
var TEMPLATE_FILE = 'app/templates/discover.html';

var TAB_CLASSES = {
  //	"users": "pgDiscoverUsers",
  featured: 'pgDiscoverFeatured',
  ranking: 'pgDiscoverRankings' // "rankings"
  //"fbfriends": "pgDiscoverFriends" // DEPRECATED
};

var MAX_TRENDING = 10;
var MAX_RECOM_USERS = 10;
var TRENDING_PERIOD = 7 * 24 * 60 * 60 * 1000; // one week

var WHYD_UIDS = snip.objArrayToValueArray(config.whydTeam, 'id');
WHYD_UIDS.push('4ff5a91c7e91c862b2a7c2b8'); // Whyd's official account

function fetchSubscriptions(p, cb) {
  if (!p || !p.loggedUser) cb({});
  else {
    console.log('fetching subscriptions for user', p.loggedUser.id);
    followModel.fetchUserSubscriptions(p.loggedUser.id, cb);
  }
}

var whydUrlRegEx = /href=\"https?:\/\/(?:www\.)?whyd\.com(\/[^"]*)\"/g;

function createHtmlElemRegEx(elName) {
  return new RegExp('<' + elName + '(?:[^>]*)?>(.*)</' + elName + '>', 'g');
}

function createHtmlElemRegEx2(elName) {
  return new RegExp('<' + elName + '(.*)/>', 'g');
}

function parseHtmlText(html) {
  return html.replace(/\<([^\s\>]+)[^\>]*\>([^\<]*)\<\/([^\>]+)\>/gi, '$2'); // remove other html elements
}

function parseHtmlAttr(html, attr) {
  return html.match(new RegExp(attr + '=[\'"]([^\'"]+)[\'"]')).pop();
}

function detectUserId(path) {
  var splitted = path.split('/');
  if (splitted.length == 3 && splitted[1] == 'u') return splitted[2];
  if (splitted.length == 2)
    for (var i in mongodb.usernames)
      if (
        mongodb.usernames[i].handle &&
        mongodb.usernames[i].handle == splitted[1]
      )
        return '' + mongodb.usernames[i]._id;
}

var processData = {
  parseBlogPost: function (p, render) {
    if (!p.loggedUser) return render({ error: 'please log in first' });
    try {
      get(p.url, function (err, page) {
        try {
          if (err) throw err;
          var response = {
            title: parseHtmlText(
              parseHtmlText(page.find(createHtmlElemRegEx('h2'))[0])
            )
          };

          var links = page.find(whydUrlRegEx);
          for (var i in links) {
            var uId = detectUserId(links[i].replace(whydUrlRegEx, '$1'));
            if (uId && mongodb.usernames[uId]) {
              //console.log(" * ", links[i], uId, mongodb.usernames[uId].name);
              response.uId = uId;
              response.uNm = mongodb.usernames[uId].name;
            }
          }

          var tmp = page.find(createHtmlElemRegEx('p'));
          if (tmp && tmp.length) {
            tmp = tmp[0].match(createHtmlElemRegEx2('img'));
            if (tmp && tmp.length) response.img = parseHtmlAttr(tmp[0], 'src');
          }

          var tmp = page.find(/<p class="date"><a.*>(.*)<\/a><\/p>/);
          if (tmp && tmp.length > 1) response.date = tmp[1];

          render(response);
        } catch (err) {
          console.error(err);
          render({ error: err });
        }
      });
    } catch (err) {
      console.error(err);
      render({ error: err });
    }
  },
  addFeatured: function (p, render) {
    if (!p.loggedUser) return render({ error: 'please log in first' });
    var post = {
      url: p.url,
      img: p.img,
      title: p.title,
      desc: p.desc,
      uId: p.uId,
      uNm: p.uNm,
      date: p.date
    };
    mongodb.collections['featured'].insert(post, function (err, result) {
      render(result);
    });
  },
  featured: function (p, render) {
    followModel.fetchUserSubscriptions((p.loggedUser || {}).id, function (
      userSub
    ) {
      var subscribed = snip.objArrayToSet(
        userSub.subscriptions || [],
        'id',
        true
      );
      mongodb.collections['featured'].find(
        {},
        { limit: 20, sort: { _id: -1 } },
        function (err, cursor) {
          cursor.toArray(function (err, posts) {
            for (var i in posts) {
              posts[i].subscribed = subscribed[posts[i].uId];
              if (posts[i].img)
                posts[i].img = posts[i].img.replace('http:', '');
            }
            render({ posts: posts });
          });
        }
      );
    });
  },
  ranking: function (p, render) {
    var users = {},
      userList;
    function incrementUserCounter(uId, name, incr) {
      users[uId] = users[uId] || {
        id: uId,
        name: (mongodb.usernames[uId] || {}).name,
        nbAdds: 0,
        nbLikes: 0,
        nbPlays: 0
      };
      users[uId][name] = (users[uId][name] || 0) + (incr || 1);
    }
    function fetchNextUserStats(cb, i) {
      var i = i || 0;
      if (i == userList.length) cb();
      else {
        var uid = '' + userList[i].id;
        console.log('fetchNextUserStats', i, uid);
        mongodb.collections['follow'].count({ tId: uid }, function (
          err,
          nbSubscribers
        ) {
          userList[i].nbSubscribers = nbSubscribers;
          // TODO: this request is heavy (e.g. on uid = 518b5a447e91c862b2adea1a)
          mongodb.collections['post'].find(
            { uId: uid },
            { limit: 9999999, fields: { _id: 0, lov: 1, nbP: 1 } },
            function (err, cursor) {
              cursor.each(function (err, f) {
                if (!f) {
                  mongodb.collections['post'].count(
                    { 'repost.uId': uid },
                    function (err, nbAdds) {
                      userList[i].nbAdds += nbAdds;
                      fetchNextUserStats(cb, i + 1);
                    }
                  );
                } else {
                  if (f.lov) userList[i].nbLikes += f.lov.length;
                  if (f.nbP) userList[i].nbPlays += f.nbP;
                }
              });
            }
          );
        });
      }
    }
    var steps = [
      function (cb) {
        var options = {
          until: new Date(Date.now() - TRENDING_PERIOD),
          excludeCtx: 'auto', // exclude auto-subscriptions
          excludeTids: WHYD_UIDS,
          limit: 10000
        };
        console.log('fetching subscription history... until', options.until);
        followModel.fetchSubscriptionHistory(options, function (act) {
          console.log('=> fetched', act.length, 'activities');
          if (!act.length) return cb();
          console.log('=> last activity: ', act[act.length - 1]);
          console.log(
            '=> date of last activity',
            act[act.length - 1]._id.getTimestamp()
          );
          for (var i in act)
            incrementUserCounter('' + act[i].tId, 'nbNewSubscribers');
          cb();
        });
      },
      /** /
			function(cb){
				console.log("removing autosubscribed users...");
				for (var i in config.autoSubscribeUsers)
					delete users[config.autoSubscribeUsers[i].id];
				cb();
			},
			/ **/
      function (cb) {
        console.log('scoring and sorting users...');
        userList = snip.mapToObjArray(users).sort(function (a, b) {
          return b.nbNewSubscribers - a.nbNewSubscribers;
        });
        if (userList.length > MAX_TRENDING)
          userList = userList.slice(0, MAX_TRENDING);
        console.log('fetching user bios...');
        userModel.fetchUserBios(userList, cb);
      },
      function (cb) {
        console.log('fetching subscription status for each user...');
        fetchSubscriptions(p, function (subscr) {
          if (subscr && subscr.subscriptions) {
            var subscr = snip.arrayToSet(
              snip.objArrayToValueArray(subscr.subscriptions, 'id')
            );
            for (var i in userList)
              userList[i].subscribed = subscr[userList[i].id];
          }
          cb();
        });
      },
      fetchNextUserStats
    ];
    (function nextStep() {
      if (!steps.length) {
        console.log('done!');
        render(userList);
      } else steps.shift()(nextStep);
    })();
  },
  recommendedUsers: function (p, render) {
    var uId = (p.loggedUser || {}).id;
    if (!uId) return render({ error: 'please log in first' });
    function renderUsers(users) {
      var users = snip.mapToObjArray(users);
      users.sort(function (a, b) {
        return b.score - a.score;
      });
      if (users.length > MAX_RECOM_USERS)
        users = users.slice(0, MAX_RECOM_USERS);
      for (var i in users) {
        console.log(
          users[i].name,
          'posted',
          (users[i].posted || []).length,
          'liked',
          (users[i].liked || []).length,
          'liker',
          (users[i].liker || []).length
        );
        delete users[i].posted;
        delete users[i].liked;
        delete users[i].liker;
      }
      userModel.fetchUserBios(users, function () {
        render({ users: users });
      });
    }
    followModel.fetchUserSubscriptions(uId, function (userSub) {
      var options = {
        excludeUids: snip.objArrayToValueArray(
          userSub.subscriptions || [],
          'id'
        )
      };
      //recomModel.recomUsersByTracks(uId, options, renderUsers);
      //recomModel.recomUsersByArtists(uId, options, renderUsers);
      //recomModel.recomUsersByRareArtists(uId, options, renderUsers);
    });
  } /*,
	"trending": function(p, render) {
		if (!p || !p.loggedUser)
			render({error:"incomplete request"});
		else {
			p.trendingUsers = [];
			followModel.fetchUserSubscriptions(p.loggedUser.id, function(userSub) {
				var followedIdSet = snip.objArrayToSet(userSub.subscriptions, "id", true);
				var uidList = [/ *p.loggedUser.id* /];
				var before = new Date(Date.now() - TRENDING_PERIOD);
				var options = {
					before: mongodb.dateToHexObjectId(before),
					limit: 1000
				};
				console.log("fetching posts before", before);
				postModel.fetchPosts({/ *uId:{$nin:uidList}* /}, null, options, function(allPosts) {
					var userSet = {};
					for (var i in allPosts) {
						userSet[allPosts[i].uId] = userSet[allPosts[i].uId] || {
							id: allPosts[i].uId,
							name: allPosts[i].name,
							subscribed: !!followedIdSet[allPosts[i].uId],
							c: 0
						};
						++userSet[allPosts[i].uId].c;
					}
					p.trendingUsers = snip.mapToObjArray(userSet);
					p.trendingUsers.sort(function(a,b) {
						return b.c - a.c;
					});
					userModel.fetchUserBios(p.trendingUsers, function() {
						if (p.trendingUsers.length > MAX_TRENDING)
							p.trendingUsers = p.trendingUsers.slice(0, MAX_TRENDING);
						render(p);
					});
				});
			});
		}
	}*/
};

exports.handleRequest = function (request, reqParams, response) {
  request.logToConsole('discover.controller', reqParams);
  reqParams = reqParams || {};

  // make sure user is logged in
  reqParams.loggedUser = request.getUser();

  function render(result) {
    if (!result || result.error) {
      console.log('discover error:', (result || {}).error);
      //response.redirect("/");
    }
    /*else*/ if (result.html)
      response.legacyRender(result.html, null, { 'content-type': 'text/html' });
    else response.legacyRender(result);
  }

  if (reqParams.ajax) {
    if (processData[reqParams.ajax]) {
      processData[reqParams.ajax](reqParams, render);
    } else render({ error: 'invalid call' });
  } else {
    if (!TAB_CLASSES[reqParams.tab]) {
      console.log('unknown tab => redirecting');
      response.temporaryRedirect('/discover/featured'); // before: /users
    } else {
      templateLoader.loadTemplate(TEMPLATE_FILE, function (template) {
        render({
          html: mainTemplate.renderWhydPage({
            bodyClass: 'pgDiscover ' + TAB_CLASSES[reqParams.tab],
            loggedUser: reqParams.loggedUser,
            content: template.render({
              isLogged: !!reqParams.loggedUser,
              isAdmin: reqParams.loggedUser
                ? request.isUserAdmin(reqParams.loggedUser)
                : false
            })
          })
        });
        //analytics.addVisit(reqParams.loggedUser, request.url);
      });
    }
  }
};

exports.controller = function (request, getParams, response) {
  //request.logToConsole("apiPost.controller", request.method);
  exports.handleRequest(request, getParams || request.body, response);
};
