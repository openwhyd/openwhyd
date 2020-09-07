/**
 * pgGenre controller
 * renders genre pages
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var mongodb = require('../models/mongodb.js');
var trackModel = require('../models/track.js');
var postModel = require('../models/post.js');
var userModel = require('../models/user.js');
var plTagsModel = require('../models/plTags.js');
var followModel = require('../models/follow.js');
//var analytics = require("../models/analytics.js");
var postsTemplate = require('../templates/posts.js');
var mainTemplate = require('../templates/mainTemplate.js');
var template = require('../templates/templateLoader.js').loadTemplate(
  'app/templates/pgGenre.html'
);

var LIMIT = 20;

function fetchAllPostsByGenre(genre, p, cb) {
  var posts = [];
  plTagsModel.getTagEngine(function (tagEngine) {
    mongodb.forEach2(
      'post',
      { q: p.q, after: p.after, before: p.before, sort: [['_id', 'desc']] },
      function (post, next) {
        if (!next || posts.length >= p.limit) cb(posts);
        else {
          var tags = tagEngine.getTagsByEid((post || {}).eId || '');
          if (tags && tags.length && tags[0].id == genre) posts.push(post);
          next();
        }
      }
    );
  });
}

function fetchGenreLatest(p, cb) {
  console.log('fetchGenreLatest...', p.genre, LIMIT);
  fetchAllPostsByGenre(
    p.genre,
    {
      q: { repost: { $exists: false } },
      after: p.after /*, before: p.before*/,
      limit: LIMIT + 1,
    },
    function (posts) {
      var hasMore = posts && posts.length > LIMIT;
      if (hasMore) posts = posts.slice(0, LIMIT);
      if (p.loggedUser)
        for (let i in posts)
          posts[i].isLoved = snip.arrayHas(posts[i].lov, '' + p.loggedUser.id);
      cb({
        hasMore: hasMore ? { lastPid: posts[LIMIT - 1]._id } : null,
        posts: posts,
      });
    }
  );
}

function fetchGenreStream(p, cb) {
  console.log('fetchGenreStream...', p.genre, LIMIT);
  trackModel.fetchPostsByGenre(p.genre, { limit: LIMIT + 1 }, function (posts) {
    console.log('fetchPostsByGenre => ', posts.length, 'posts');
    var firstIndex = parseInt(p.skip || 0);
    var hasMore =
      posts && posts.length > LIMIT ? { skip: firstIndex + LIMIT } : null; // to do before renderPosts
    if (hasMore) posts = posts.slice(0, LIMIT);
    for (let i in posts) {
      if (posts[i].rankIncr < 0) posts[i].cssClass = 'rankingUp';
      else if (posts[i].rankIncr > 0) posts[i].cssClass = 'rankingDown';
      if (p.loggedUser)
        posts[i].isLoved = snip.arrayHas(posts[i].lov, '' + p.loggedUser.id);
    }
    cb({
      hasMore: hasMore,
      posts: posts,
    });
  });
}

function populateUserListData(tagEngine, loggedUid, users, cb) {
  followModel.fetchSubscriptionSet(loggedUid, function (subscrSet) {
    (function next(i) {
      if (--i < 0) cb(users);
      else if (!users[i]) {
        console.error('Warning: null user at index', i);
        next(i);
      } else {
        var uid = users[i].id;
        userModel.fetchByUid(uid, function (user) {
          postModel.countUserPosts(uid, function (nbTracks) {
            followModel.countSubscribers(uid, function (nbSubscribers) {
              followModel.countSubscriptions(uid, function (nbSubscriptions) {
                tagEngine.fetchTagsByUid(uid, function (tags) {
                  users[i] = user; //mongodb.getUserFromId(uid);
                  users[i].subscribed = subscrSet[uid];
                  users[i].url = '/u/' + uid;
                  users[i].tags = tags;
                  users[i].nbTracks = nbTracks;
                  users[i].nbSubscriptions = nbSubscriptions;
                  users[i].nbSubscribers = nbSubscribers;
                  next(i);
                });
              });
            });
          });
        });
      }
    })(users.length);
  });
}

function fetchGenreUsers(p, cb) {
  plTagsModel.getTagEngine(function (tagEngine) {
    var users = tagEngine.getUsersByTags([p.genre]) || [];
    if (users.length > 20) users = users.slice(0, 20);
    populateUserListData(tagEngine, p.loggedUser.id, users, function () {
      cb({ users: users });
    });
  });
}

exports.controller = function (request, reqParams, response) {
  request.logToConsole('pgGenre.controller', reqParams);

  var loggedInUser = request.getUser() || {};
  if (loggedInUser && loggedInUser.id)
    loggedInUser.isAdmin = request.isUserAdmin(loggedInUser);

  reqParams = reqParams || {};

  // rendering functions

  function render(data) {
    data = data || {
      error:
        'Nothing to render! Please send the URL of this page to ' +
        process.appParams.feedbackEmail,
    };
    if (data.error) console.log('ERROR: ', data.error);
    if (data.html) {
      response.renderHTML(data.html);
      // console.log('rendering done!');
      //if (loggedInUser && loggedInUser.id && !reqParams.after && !reqParams.before)
      //	analytics.addVisit(loggedInUser, request.url/*"/u/"+uid*/);
    } else response.legacyRender(data.json || data.error);
  }

  function renderPage(content) {
    render({
      html: mainTemplate.renderWhydPage({
        bodyClass: 'pgGenre',
        loggedUser: loggedInUser,
        pageUrl: request.url,
        content: content,
      }),
    });
  }

  // processing parameters

  var genre =
    (plTagsModel.extractGenreTags(reqParams.genre || '') || []).shift() || '';
  var tab = reqParams.tab || 'latest'; //"hot";

  var fetchingParams = {
    genre: genre,
    skip: reqParams.skip,
    after: reqParams.after,
    loggedUser: loggedInUser,
  };

  var renderingParams = {
    tab: tab,
    genre: genre,
    genreUrl: '/genre/' + genre.replace(/\s+/g, '-'),
    header: !reqParams.skip && !reqParams.after,
    //rawFeed: !!reqParams.skip,
    loggedUser: loggedInUser,
  };

  // routing to the right sub-controller

  if (!genre) render({ error: "hmm... we don't know that genre..." });
  else if (tab == 'hot') {
    fetchGenreStream(fetchingParams, function (r) {
      renderingParams.tabHot = true;
      renderingParams.showTracks = {
        posts: postsTemplate.renderPosts(r.posts),
      };
      renderPage(template.render(renderingParams));
    });
  } else if (tab == 'latest') {
    fetchGenreLatest(fetchingParams, function (r) {
      renderingParams.tabLatest = true;
      renderingParams.showTracks = {
        posts: postsTemplate.renderPosts(r.posts),
      };
      renderingParams.hasMore = r.hasMore;
      if (reqParams.after) render({ html: template.render(renderingParams) });
      else renderPage(template.render(renderingParams));
    });
  } else if (tab == 'people') {
    fetchGenreUsers(fetchingParams, function (r) {
      renderingParams.showUsers = {
        items: r.users,
      };
      renderPage(template.render(renderingParams));
    });
  } else response.badRequest();
};
