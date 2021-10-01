const config = require('../models/config.js');
var feedTemplate = require('../templates/feed.js');
const {
  fetchPlaylists,
  countSubscribers,
  countSubscriptions,
  fetchIsSubscribed,
  fetchLikes,
  fetchNbTracks,
} = require('./LibUserData');

const bareFormats = new Set(['json', 'links']);

const LNK_URL_PREFIX = {
  fb: 'facebook.com/',
  tw: 'twitter.com/',
  sc: 'soundcloud.com/',
  yt: 'youtube.com/user/',
  igrm: 'instagram.com/',
};

class PageGenerator {
  constructor(user, options) {
    this.options = options;
    options.bodyClass = '';
    this.populateCommonTemplateParameters(user);
    this.preparePaginationParameters();
  }

  static renderUserLinks(lnk) {
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

  populateCommonTemplateParameters(user) {
    const options = this.options;
    options.pageUrl = options.pageUrl.replace(
      '/' + user.handle,
      '/u/' + user._id
    );

    options.uid = '' + user._id;
    options.user = user;
    options.displayPlaylistName = !options.playlistId;

    if (options.user && options.user.lnk)
      this.renderUserLinks(options.user.lnk);
  }

  preparePaginationParameters() {
    const options = this.options;
    options.fetchParams = {
      after: options.after,
      before: options.before,
      limit: options.limit,
    };
    if (options.embedW)
      options.fetchParams.limit = config.nbTracksPerPlaylistEmbed;
    else if (options.limit && typeof options.limit !== 'number') {
      if (typeof options.limit === 'string')
        options.fetchParams.limit = parseInt(options.limit);
      else if (typeof options.limit === 'object' && options.limit.push)
        options.fetchParams.limit = parseInt(options.limit.pop());
      // keep only the last value
      // see https://github.com/openwhyd/openwhyd/issues/89
    }
  }

  async populateSidebarAndAdditionalPageElements() {
    const options = this.options;
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

  renderHtml(tracks, callback) {
    if (!this.options.format && !this.options.embedW) {
      this.options.customFeedTemplate = this.getCustomFeedTemplate();
    }
    feedTemplate.renderFeedAsync(tracks, this.options, callback);
  }

  async fetchAndRender() {
    try {
      await this.populateSidebarAndAdditionalPageElements();
      const tracks = await this.prepareTemplateData();
      if (bareFormats.has(this.options.format)) return tracks;
      return new Promise((resolve) => this.renderHtml(tracks, resolve));
    } catch (errorMsg) {
      return errorMsg;
    }
  }
}

exports.PageGenerator = PageGenerator;
