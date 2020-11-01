/**
 * discover controller (inspired by onboarding)
 * @author adrienjoly, whyd
 */

var get = require('../lib/get');
var snip = require('../snip.js');
var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');

var templateLoader = require('../templates/templateLoader.js');
var mainTemplate = require('../templates/mainTemplate.js');
var TEMPLATE_FILE = 'app/templates/discover.html';

var TAB_CLASSES = {
  featured: 'pgDiscoverFeatured',
  ranking: 'pgDiscoverRankings', // "rankings"
};

var MAX_TRENDING = 10;
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

var whydUrlRegEx = /href="https?:\/\/(?:www\.)?whyd\.com(\/[^"]*)"/g;

function createHtmlElemRegEx(elName) {
  return new RegExp('<' + elName + '(?:[^>]*)?>(.*)</' + elName + '>', 'g');
}

function createHtmlElemRegEx2(elName) {
  return new RegExp('<' + elName + '(.*)/>', 'g');
}

function parseHtmlText(html) {
  return html.replace(/<([^\s>]+)[^>]*>([^<]*)<\/([^>]+)>/gi, '$2'); // remove other html elements
}

function parseHtmlAttr(html, attr) {
  return html.match(new RegExp(attr + '=[\'"]([^\'"]+)[\'"]')).pop();
}

function detectUserId(path) {
  var splitted = path.split('/');
  if (splitted.length == 3 && splitted[1] == 'u') return splitted[2];
  if (splitted.length == 2)
    for (let i in mongodb.usernames)
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
            ),
          };

          var links = page.find(whydUrlRegEx);
          for (let i in links) {
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

          tmp = page.find(/<p class="date"><a.*>(.*)<\/a><\/p>/);
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
      date: p.date,
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
            for (let i in posts) {
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
        nbPlays: 0,
      };
      users[uId][name] = (users[uId][name] || 0) + (incr || 1);
    }
    function fetchNextUserStats(cb, i = 0) {
      if (i == userList.length) cb();
      else {
        var uid = '' + userList[i].id;
        console.log('fetchNextUserStats', i, uid);
        mongodb.collections['follow'].countDocuments({ tId: uid }, function (
          err,
          nbSubscribers
        ) {
          userList[i].nbSubscribers = nbSubscribers;
          // TODO: this request is heavy (e.g. on uid = 518b5a447e91c862b2adea1a)
          mongodb.collections['post'].find(
            { uId: uid },
            { limit: 9999999, fields: { _id: 0, lov: 1, nbP: 1 } },
            function (err, cursor) {
              cursor.forEach(
                (err, f) => {
                  if (f) {
                    if (f.lov) userList[i].nbLikes += f.lov.length;
                    if (f.nbP) userList[i].nbPlays += f.nbP;
                  }
                },
                () => {
                  mongodb.collections['post'].countDocuments(
                    { 'repost.uId': uid },
                    function (err, nbAdds) {
                      userList[i].nbAdds += nbAdds;
                      fetchNextUserStats(cb, i + 1);
                    }
                  );
                }
              );
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
          limit: 10000,
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
          for (let i in act)
            incrementUserCounter('' + act[i].tId, 'nbNewSubscribers');
          cb();
        });
      },
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
            const subscr = snip.arrayToSet(
              snip.objArrayToValueArray(subscr.subscriptions, 'id')
            );
            for (let i in userList)
              userList[i].subscribed = subscr[userList[i].id];
          }
          cb();
        });
      },
      fetchNextUserStats,
    ];
    (function nextStep() {
      if (!steps.length) {
        console.log('done!');
        render(userList);
      } else steps.shift()(nextStep);
    })();
  },
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
                : false,
            }),
          }),
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
