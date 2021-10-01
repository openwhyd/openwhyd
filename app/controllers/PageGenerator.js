const config = require('../models/config.js');

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
}

exports.PageGenerator = PageGenerator;
