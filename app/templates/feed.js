/**
 * userLibraryFeed template
 * renders a gallery/feed/timeline of posts, for a given user's category
 * @author adrienjoly, whyd
 **/
const snip = require('../snip.js');
const config = require('../models/config.js');
const postsTemplate = require('../templates/posts.js');
const mainTemplate = require('../templates/mainTemplate.js');
const templateLoader = require('../templates/templateLoader.js');

const FUNNY_EMAILS = [
  'steve.jobs@heaven.org',
  'isaac@asimov.com',
  'jimi.hendrix@woodstock.com',
  'marissa@google.com',
  'iggy@stooges.com',
  'ballmer@developers.net',
  'r.branson@space.net',
  'felix@redbull.es',
  'lennon@imagine.org',
  'lets.meet@nine.com',
  'anakin@thedarkside.com',
  'billg@tes.com',
  'adrien@omalleys.ie',
  'kim@me.ga',
  'tony@lasagna.it',
  'gilles@barbus.fr',
  'loick69@swag.com',
  'jie@somewhere.cn',
  'rolling@river.com',
  'borntobe@whyd.com',
  'stuck@sea.sos',
  'men@work.au',
  'love@firstsight.com',
];

let templates = {};

const loadTemplate = (path) =>
  new Promise((resolve) => templateLoader.loadTemplate(path, resolve));

async function loadTemplates() {
  templates = {
    html: await loadTemplate('app/templates/feed.html'),
    embed: await loadTemplate('app/templates/feedEmbed.html'),
    embedv2: await loadTemplate('app/templates/feedEmbedV2.html'),
    sideBox: await loadTemplate('app/templates/sideBox.html'),
  };
}

loadTemplates();

function prepareFeedVars(posts, options) {
  options.bodyClass =
    (options.bodyClass || '') + (options.ownProfile ? ' ownProfile' : '');

  const feedVars = {
    sideBox: templates['sideBox'].render(),
    user: options.user,
    userPrefs: (options.loggedUser || {}).pref || {},
    loggedUser: options.loggedUser,
    isUserLogged: options.loggedUser && options.loggedUser.id,
    header: exports.shouldRenderWholeProfilePage(options),
    emptyFeed:
      posts.length == 0 && !options.before
        ? { ownProfile: options.ownProfile }
        : null,
    nbPosts: options.nbPosts || (options.user ? options.user.nbPosts : null),
    ownProfile: options.ownProfile,
    libRootUrl: '/stream',
    subscriptions: options.subscriptions, // = {nbSubscribers, nbSubscriptions}
    recentActivity: options.recentActivity,
    globalFeed: options.globalFeed,
    homeFeed: options.homeFeed,
    streamTitle: options.tabTitle, //options.streamTitle,
    inviteAdEmailPlaceholder:
      FUNNY_EMAILS[Math.floor(FUNNY_EMAILS.length * Math.random())],
    //inviteBox: options.inviteBox
  };

  if (!options.before) feedVars.hasMore = options.hasMore; // prevent from showing the button when a newly added track is requested

  if (posts.length && !options.after)
    feedVars.hasLess = {
      firstPid:
        (options.playlist && posts[0].order != null
          ? parseInt(posts[0].order)
          : 0) || posts[0]._id,
    };

  if (options.playlist) {
    feedVars.playlist = options.playlist || {};
    if (feedVars.playlist.name)
      feedVars.playlist._js_name = snip.sanitizeJsStringInHtml(
        feedVars.playlist.name,
      );
    feedVars.playlist.url =
      config.urlPrefix +
      '/u/' +
      options.user.id +
      '/playlist/' +
      feedVars.playlist.id;
    feedVars.playlist.urlEncoded = encodeURIComponent(feedVars.playlist.url);
    feedVars.playlist.urlEncodedTweet = encodeURIComponent(
      '♫ ' + feedVars.playlist.name /*+ ' ' + feedVars.playlist.url*/,
    );
    feedVars.playlist.nbTracks =
      feedVars.playlist.nbTracks || (posts ? posts.length : 'no');
    feedVars.trackOrderUrl =
      '/u/' + options.user.id + '/playlist/' + feedVars.playlist.id + '/edit';
    feedVars.prevPageInList = options.prevPageInList;
    feedVars.nextPageInList = options.nextPageInList;
  }

  if (options.user && options.user.id) {
    feedVars.libRootUrl = '/u/' + options.user.id;
    feedVars.friends = options.friends;
    feedVars.activity = options.activity;
    feedVars.playlists = options.playlists;
    feedVars.nbPlaylists = options.nbPlaylists; // || (options.user.pl ? options.user.pl.length : 0);
    feedVars.nbTracks = options.user.nbTracks;
    feedVars.nbLikes = options.user.nbLikes || 0;
    feedVars.hasPlaylists = feedVars.nbPlaylists > 0;
    feedVars.showTracks = options.showTracks;
    feedVars.showPlaylists = options.showPlaylists;
    feedVars.showLikes = options.showLikes;
    feedVars.showActivity = options.showActivity;
    feedVars.showSubscribers = options.showSubscribers;
    feedVars.showSubscriptions = options.showSubscriptions;
    feedVars.similarity = options.similarity;
    if (feedVars.header)
      feedVars.header = {
        img: options.user.img || '/img/u/' + options.user.id, // render.imgUrl("/u/" + options.user.id)
      };
    if (feedVars.user.bio)
      feedVars.user.renderedBio = snip
        .replaceURLWithFullHTMLLinks(snip.htmlEntities(feedVars.user.bio))
        .replace(/\n\n/g, '\n')
        .replace(/\n/g, '<br/>');
    if (feedVars.user.name)
      feedVars.user._js_name = snip.sanitizeJsStringInHtml(feedVars.user.name);
  }

  if (options.embedW) {
    feedVars.firstTrack =
      posts && posts.length > 0
        ? posts[0]
        : {
            id: '',
            img: '',
            url: 'javascript:{}',
          };
    if (!feedVars.firstTrack.img)
      feedVars.firstTrack.img = '/images/cover-track.png';
    options.title =
      (options.playlist || {}).name +
      ' by ' +
      (options.user || {}).name +
      ' - whyd';
  }

  return feedVars;
}

exports.renderFeedAsync = function (posts, options, callback) {
  postsTemplate.renderPostsAsync(posts, options, function (postsHtml) {
    const feedVars = prepareFeedVars(posts, options);
    feedVars.posts = postsHtml;

    //loadTemplates(function(){
    const format = options.format
      ? options.format.toLowerCase()
      : options.embedW
        ? 'embed'
        : 'html';
    //var t = (options.embedW ? templateEmbed[options.format || "oldEmbed"] : null) || template;
    if (format == 'json') callback(postsHtml);
    else
      callback(
        (
          options.customFeedTemplate ||
          templates[format] ||
          templates['html']
        ).render(feedVars),
      );
    // console.log('renderFeedAsync => ' + posts.length + ' posts');
    //});
  });
};

exports.renderFeedPage = function (user, options) {
  options = options || {};
  options.js = options.js || [];
  options.css = options.css || [];
  return mainTemplate.renderWhydPage(options);
};

exports.renderFeedEmbed = function (feedHtml, options) {
  options = options || {};
  options.js = options.js || [];
  options.css = options.css || [];
  options.nocss = true;
  options.css.push(
    (options.format || '').toLowerCase() == 'embedv2'
      ? 'feedEmbedV2.css'
      : 'feedEmbed.css',
  );
  options.js.push('playem-min.js');
  options.js.push('playem-youtube-iframe-patch.js');
  options.js.push('whydPlayer.js');
  options.js.push('jquery.tinyscrollbar.min.js'); // http://baijs.nl/tinyscrollbar/
  return mainTemplate.renderWhydFrame(feedHtml, options);
};

/**
 * @param {*} options - rendering options transiting from the API to template renderers.
 * @returns true if the profile page must be rendered completely, i.e. with header and side bars.
 */
exports.shouldRenderWholeProfilePage = function (options) {
  return options.wholePage || (!options.after && !options.before);
};
