/**
 * Html-based template for rendering a feed of posts
 * @author adrienjoly, whyd
 **/

var snip = require('../snip.js');
var config = require('../models/config.js');
var postModel = require('../models/post.js');
var commentModel = require('../models/comment.js');
var templateLoader = require('../templates/templateLoader.js');
var template = templateLoader.loadTemplate('app/templates/posts.html');

var getUserNameFromId = require('../models/mongodb.js').getUserNameFromId;

var MAX_POSTS = config.nbPostsPerNewsfeedPage;
var MAX_NB_REPOST_FACES = 12;
var RE_MENTION = /@\[([^\]]*)\]\(user:([^)]*)\)/gi;

// database functions

function getPostId(post = {}) {
  return '' + (post._id || post.id);
}

function loadComments(posts, cb) {
  if (!(posts || []).length) cb();
  else
    commentModel.fetch({ pId: posts.map(getPostId) }, {}, function (comments) {
      comments = snip.groupObjectsBy(comments, 'pId');
      //console.log("=> comments", comments)
      for (let i in posts)
        if (posts[i])
          try {
            posts[i].comments = comments[getPostId(posts[i])] || [];
          } catch (e) {
            console.error(e.stack);
          }
      cb();
    });
}

function loadReposts(posts, cb) {
  if (!(posts || []).length) cb();
  else {
    var query = { 'repost.pId': { $in: posts.map(getPostId) } };
    postModel.fetchPosts(
      query,
      { fields: { uId: 1, uNm: 1, 'repost.pId': 1 } },
      { limit: MAX_NB_REPOST_FACES },
      function (reposts) {
        reposts = reposts || { error: 'null reposts response from fetchPosts' };
        if (reposts.error) {
          cb(reposts);
          return;
        }
        reposts = snip.groupObjectsBy(
          reposts.map(function (r) {
            return { id: r.uId, name: r.uNm, pId: r.repost.pId };
          }),
          'pId'
        );
        for (let i in posts)
          if (posts[i])
            try {
              posts[i].reposts = reposts[getPostId(posts[i])] || [];
            } catch (e) {
              console.error(e.stack);
            }
        cb();
      }
    );
  }
}

// rendering functions

function renderCommentDate(when) {
  var date = new Date(when);
  var ago = new Date() - date;
  if (ago < 1000 * 60 * 60 * 24) return snip.renderTime(date);
  else if (ago < 1000 * 60 * 60 * 24 * 32)
    return snip.renderShortMonthYear(date);
  else return snip.renderTimestamp(ago) + ' ago';
}

exports.preparePost = function (post, options) {
  if (!post) return null;
  post._id = post._id || post.id;
  var when = post._id ? post._id.getTimestamp().getTime() : undefined;

  if (post.ctx == 'mob')
    post.src = {
      id: config.urlPrefix + '/mobile',
      shortenedUrl: 'Whyd Mobile Track Finder',
    };
  else if (post.src) post.src.shortenedUrl = snip.shortenURLs(post.src.id);

  if (post.repost) {
    post.repost.url = post.tId + '/' + post.repost.pId;
    post.repost.userImg = config.imgUrl('/u/' + post.repost.uId);
    post.repost.userName = post.repost.uNm;
  }

  options = options || {};
  var loggedUser = options.loggedUser || {};

  // rendering comments

  var comments = post.comments || [];
  //var desc = snip.replaceURLWithHTMLLinks(snip.htmlEntities(post.text || '')).replace(/\n\n/g, "\n").replace(/\n/g,"<br/>");
  if (post.text)
    comments.unshift({
      _id: post._id,
      uId: post.uId,
      uNm: post.uNm,
      text: post.text,
    });

  for (let j = 0; j < comments.length; ++j) {
    var c = comments[j];
    var t = c._id.getTimestamp();
    c.t = t.getTime();
    c.tRendered = renderCommentDate(t);
    c.html = snip
      .replaceURLWithHTMLLinks(snip.htmlEntities(c.text || ''))
      .replace(/\n\n/g, '\n')
      .replace(/\n/g, '<br/>');
    c.html = c.html.replace(RE_MENTION, function (match, uNm, uId) {
      return '<a href="/u/' + uId + '">' + snip.htmlEntities(uNm) + '</a>';
    });
    c.canDelete = loggedUser.id == c.uId || loggedUser.id == post.uId;
  }

  if (comments.length > 3)
    for (let j = 2; j < comments.length - 1; ++j)
      comments[j].cssClass = (comments[j].cssClass || '') + ' hidden';

  // rendering dates

  var date = new Date(when);
  date =
    snip.renderTime(date) +
    ' - ' +
    date.getDate() +
    ' ' +
    snip.MONTHS_SHORT[date.getMonth()] +
    ' ' +
    date.getFullYear();

  var ago = new Date() - when;
  if (ago < 1000 * 60 * 60 * 24 * 32) ago = snip.renderTimestamp(ago);
  else ago = snip.renderShortMonthYear(when);

  // setting main post attributes

  var newPost = {
    loggedUser: loggedUser.id && loggedUser,
    id: post._id,
    initialid: post.repost ? post.repost.pId : post._id,
    img:
      post.img && post.img != 'null'
        ? post.img.replace('http:', '')
        : '/images/cover-track.png',
    name: post.name || '-',
    eId: post.eId,
    trackUrl: config.translateEidToUrl(post.eId),
    comments: comments,
    nbComments: comments.length,
    hasComments: !!comments.length,
    src: post.src,
    postUrl: '/c/' + post._id, //(post.repost ? post.repost.pId : post._id),
    dateRendered: date,
    agoTimestamp: when,
    agoRendered: ago,
    isLoved:
      post.isLoved ||
      (loggedUser.id && !options.noFooter
        ? snip.arrayHas(post.lov, loggedUser.id)
        : null),
    hasLoves: (post.lov || []).length > 0,
    nbLoves: post.nbL || (post.lov || []).length,
    hasReposts: (post.nbR || 0) > 0,
    nbReposts: post.nbR || 0,
    /*hasPlays: !!post.nbP,
		nbPlays: post.nbP,*/
    reposts: post.reposts,
    lov: post.lov,
    uId: post.uId,
    uNm: post.uNm,
    uImg: config.imgUrl('/u/' + post.uId),
    ownPost: post.uId == loggedUser.id,
    cssClass: post.cssClass || '',
    score: post.score,
  };

  //if (options.customImgHandler)
  //	newPost.imgHD = options.customImgHandler(newPost.eId, newPost.img);
  // this has to be done dynamically in /public/js/postPage.js

  // rendering "faces"

  newPost.faces = snip.removeDuplicates(
    (post.reposts || []).concat(post.lov || []).map(function (u) {
      return { id: u.id || u, name: getUserNameFromId(u.id || u) };
    }),
    'id'
  );

  // rendering "via" source

  if (/*options.displayVia &&*/ post.eId && post.eId[0] == '/') {
    var meta = config.getPlayerMeta(post.eId, (post.src || {}).id);
    if (meta) newPost.via = meta;
  }

  if (post.repost && post.repost.uId != post.uId) {
    newPost.isARepost = true; //!!post.repost;
    newPost.repost = post.repost;
  }

  if (options.displayPlaylistName && post.pl) {
    newPost.pl = post.pl;
    newPost.pl.plUrl = '/u/' + post.uId + '/playlist/' + post.pl.id;
  } // we displaying a playlist => provide order of each track
  else newPost.order = { n: post.order };

  newPost.showAdded = newPost.repost || newPost.pl;

  return newPost;
};

exports.render = function (postsVars) {
  return template.render(postsVars);
};
/*
exports.renderFeed = function(posts, topic, options) {
options = options || {};
return !posts || posts.length == 0 ? options.defaultHtml || '' : exports.renderPosts(posts, options);
};
*/
exports.renderPosts = function (posts, options) {
  posts = posts || [];
  options = options || {};
  console.log('_ _ _ _ _ _ _ _PREPAREEE');

  for (let p in posts) posts[p] = exports.preparePost(posts[p], options || {});

  return exports.render({
    posts: posts,
  });
};

exports.renderPostsAsync = function (posts, options, callback) {
  posts = posts || [];
  options = options || {};
  options.loggedUser =
    options.loggedUser ||
    {
      /*id:-1*/
    };
  options.ownProfile =
    options.user && options.user.id && options.user.id == options.loggedUser.id;

  var maxPosts = options.limit || MAX_POSTS;
  var hasMore = posts.length > maxPosts;
  if (hasMore) {
    posts = posts.slice(0, maxPosts);
    var lastPost = posts[posts.length - 1];
    const lastPid =
      options.playlist && !isNaN(lastPost.order)
        ? lastPost.order
        : lastPost._id;
    exports.populateNextPageUrl(options, lastPid);
  }

  function prepareAndRender(posts, options, cb) {
    var templateVars = options.templateVars || {};
    templateVars.posts = posts.map(function (post) {
      return exports.preparePost(post, options || {});
    });
    if (options.customTemplateFile)
      templateLoader.loadTemplate(options.customTemplateFile, function (tmpl) {
        cb(tmpl.render(templateVars));
      });
    else cb(exports.render(templateVars));
  }

  loadComments(posts, function () {
    loadReposts(posts, function () {
      if (options.format == 'json') callback(posts);
      else {
        prepareAndRender(
          posts,
          {
            loggedUser: options.loggedUser,
            customTemplateFile: options.customTemplateFile,
            customImgHandler: options.customImgHandler,
            templateVars: options.templateVars,
            ownProfile: options.ownProfile,
            displayVia: !!options.embedW,
            displayPlaylistName: options.displayPlaylistName,
          },
          callback
        );
      }
    });
  });
};

/**
 * @param {*} options - rendering options transiting from the API to template renderers.
 * @param {string} lastPid - identifier of the last track of the current page.
 */
exports.populateNextPageUrl = function (options, lastPid) {
  const pageUrl = new URL(options.pageUrl, config.urlPrefix);
  pageUrl.searchParams.append('after', lastPid);
  pageUrl.searchParams.append('wholePage', true);
  options.hasMore = {
    lastPid,
    nextWholePageUrl: pageUrl.toString(),
  };
};
