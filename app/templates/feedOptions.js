// Functions used during the population and rendering of user profile pages,
// gathered here to centralize common logic and clarify their intended behavior.

const { URL } = require('url');
var config = require('../models/config.js');
var userModel = require('../models/user.js');
var followModel = require('../models/follow.js');
var postModel = require('../models/post.js');

function fetchPlaylists(options) {
  return new Promise((resolve) =>
    userModel.fetchPlaylists(options.user, {}, resolve)
  );
}

function fetchLikes(options) {
  return new Promise((resolve) =>
    postModel.countLovedPosts(options.user.id, resolve)
  );
}

function fetchSubscriptions(options) {
  return new Promise((resolve) =>
    followModel.countSubscriptions(options.user.id, function (nbSubscriptions) {
      followModel.countSubscribers(options.user.id, function (nbSubscribers) {
        resolve({
          nbSubscriptions: nbSubscriptions,
          nbSubscribers: nbSubscribers,
        });
      });
    })
  );
}

function isSubscribed(options) {
  return new Promise((resolve) =>
    followModel.get(
      { uId: options.loggedUser.id, tId: options.user.id },
      (err, res) => resolve(res)
    )
  );
}

function fetchNbTracks(options) {
  return new Promise((resolve) =>
    postModel.countUserPosts(options.user.id, resolve)
  );
}

/**
 * Populate additional information fields displayed on a user profile,
 * e.g. number of tracks, likes, playlists, subscribers and subscriptions.
 * @param {*} options - rendering options transiting from the API to template renderers.
 */
exports.populateWholeProfilePage = async function (options) {
  options.user.pl = await fetchPlaylists(options);
  options.subscriptions = await fetchSubscriptions(options);
  options.user.isSubscribed = !!(await isSubscribed(options));
  options.user.nbLikes = await fetchLikes(options);
  const nbPosts = await fetchNbTracks(options);
  options.user.nbTracks =
    nbPosts > 9999 ? Math.floor(nbPosts / 1000) + 'k' : nbPosts;
};

/**
 * @param {*} options - rendering options transiting from the API to template renderers.
 * @returns true if the profile page must be rendered completely, i.e. with header and side bars.
 */
exports.mustRenderWholeProfilePage = function (options) {
  return options.wholePage || (!options.after && !options.before);
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
