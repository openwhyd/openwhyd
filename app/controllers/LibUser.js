/**
 * LibUser class
 * fetchs and renders a user's library
 * @author adrienjoly, whyd
 **/

var config = require('../models/config.js');
const {
  fetchPlaylists,
  countSubscribers,
  countSubscriptions,
  fetchIsSubscribed,
  fetchLikes,
  fetchNbTracks,
} = require('./LibUserData');
const { PlaylistPageGenerator } = require('./PlaylistPageGenerator');
const { ProfilePageGenerator } = require('./ProfilePageGenerator');

var LNK_URL_PREFIX = {
  fb: 'facebook.com/',
  tw: 'twitter.com/',
  sc: 'soundcloud.com/',
  yt: 'youtube.com/user/',
  igrm: 'instagram.com/',
};

function generateMixpanelCode(options) {
  return [
    '<script>',
    ' window.Whyd.tracking.log("Visit profile", "' + options.uid + '");',
    '</script>',
  ].join('\n');
}

function renderUserLinks(lnk) {
  // clean social links
  for (let i in lnk) lnk[i] = ('' + lnk[i]).trim();

  // for each social link, detect username and rebuild URL
  for (let i in LNK_URL_PREFIX)
    if (lnk[i]) {
      var parts = lnk[i].split('?').shift().split('/');
      lnk[i] = ''; // by default, if no username was found
      var username = '';
      while (!(username = parts.pop()));
      lnk[i] = LNK_URL_PREFIX[i] + username; //parts[j];
    }

  // make sure URLs are valid
  for (let i in lnk)
    if (lnk[i]) {
      var lnkBody = '//' + lnk[i].split('//').pop();
      if (i == 'home') {
        var isHttps = lnk[i].match(/^https:\/\//);
        lnk[i] = (isHttps ? 'https' : 'http') + ':' + lnkBody;
      } else {
        lnk[i] = lnkBody;
      }
    } else delete lnk[i];

  if (lnk.home)
    lnk.home = {
      url: lnk.home,
      renderedUrl: lnk.home.split('//').pop().split('/').shift(),
    };
}

async function populateSidebarAndAdditionalPageElements(options) {
  if (!options.after && !options.before) {
    options.user.pl = await fetchPlaylists(options);
    options.subscriptions = {
      nbSubscribers: await countSubscribers(options),
      nbSubscriptions: await countSubscriptions(options),
    };
    options.user.isSubscribed = await fetchIsSubscribed(options);
    options.user.nbLikes = await fetchLikes(options);
    const nbPosts = await fetchNbTracks(options);
    options.user.nbTracks =
      nbPosts > 9999 ? Math.floor(nbPosts / 1000) + 'k' : nbPosts;
  }
}

function populateCommonTemplateParameters(options, user) {
  options.pageUrl = options.pageUrl.replace(
    '/' + user.handle,
    '/u/' + user._id
  );

  options.uid = '' + user._id;
  options.user = user;
  options.displayPlaylistName = !options.playlistId;

  if (options.user && options.user.lnk) renderUserLinks(options.user.lnk);
  return options;
}

function renderResponse(lib, options, feed) {
  if (options.callback) {
    var safeCallback = options.callback.replace(/[^a-z0-9_]/gi, '');
    lib.renderOther(
      safeCallback + '(' + JSON.stringify(feed) + ')',
      'application/javascript'
    );
  } else if (options.format == 'links') {
    lib.renderOther(
      feed
        .map(function (p) {
          return config.translateEidToUrl((p || {}).eId);
        })
        .join('\n'),
      'text/text'
    );
  } else if (options.showPlaylists && options.format == 'json') {
    lib.renderJson(options.playlists);
  } else if (options.format == 'json') {
    lib.renderJson(feed);
  } else if (options.after || options.before) {
    lib.render({ html: feed });
  } else
    lib.renderPage(
      options.user,
      null /*sidebarHtml*/,
      generateMixpanelCode(options) + feed
    );
}

async function renderUserLibrary(lib, user) {
  if (user == null) return lib.render({ errorCode: 'USER_NOT_FOUND' });

  const options = populateCommonTemplateParameters(lib.options, user);

  await populateSidebarAndAdditionalPageElements(options);

  const pageGenerator = options.playlistId
    ? new PlaylistPageGenerator(options)
    : new ProfilePageGenerator(options);

  const tracks = await pageGenerator.fetchAndRender();

  renderResponse(lib, options, tracks); // reponds through lib.render*()
}

exports.render = renderUserLibrary;
