const config = require('../models/config.js');
var feedTemplate = require('../templates/feed.js');

const bareFormats = new Set(['json', 'links']);

class PageGenerator {
  constructor(options) {
    this.options = options;
    options.bodyClass = '';
    this.preparePaginationParameters();
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

  renderHtml(tracks, callback) {
    if (!this.options.format && !this.options.embedW) {
      this.options.customFeedTemplate = this.getCustomFeedTemplate();
    }
    feedTemplate.renderFeedAsync(tracks, this.options, callback);
  }

  async fetchAndRender() {
    try {
      const tracks = await this.prepareTemplateData();
      if (bareFormats.has(this.options.format)) return tracks;
      return new Promise((resolve) => this.renderHtml(tracks, resolve));
    } catch (errorMsg) {
      return errorMsg;
    }
  }
}

exports.PageGenerator = PageGenerator;
