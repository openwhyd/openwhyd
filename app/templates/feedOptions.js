function mustRenderWholeProfilePage(options) {
  return !options.after && !options.before;
}

exports.mustRenderWholeProfilePage = mustRenderWholeProfilePage;

function populateNextPageUrl(options, lastPid) {
  options.hasMore = { lastPid };
}

exports.populateNextPageUrl = populateNextPageUrl;
