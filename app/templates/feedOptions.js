// Functions used during the population and rendering of user profile pages,
// gathered here to centralize common logic and clarify their intended behavior.

/**
 * @param {*} options - rendering options transiting from the API to template renderers.
 * @returns true if the profile page must be rendered completely, i.e. with header and side bars.
 */
function mustRenderWholeProfilePage(options) {
  return !options.after && !options.before;
}

exports.mustRenderWholeProfilePage = mustRenderWholeProfilePage;

/**
 * @param {*} options - rendering options transiting from the API to template renderers.
 * @param {string} lastPid - identifier of the last track of the current page.
 */
function populateNextPageUrl(options, lastPid) {
  options.hasMore = { lastPid };
}

exports.populateNextPageUrl = populateNextPageUrl;
