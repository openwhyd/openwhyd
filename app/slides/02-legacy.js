/* eslint-disable no-undef */

// add final rendering functions at queue of the call chain
var fcts = [fetchAndRender, renderResponse];

// prepend required fetching operations in head of the call chain
if (!options.after && !options.before)
  // main tab: tracks (full layout to render, with sidebar)
  fcts = [
    fetchPlaylists,
    /*fetchSubscriptions,*/ fetchStats,
    fetchLikes,
    fetchNbTracks /*fetchSimilarity*/,
  ].concat(fcts);
//if (options.showSubscribers || options.showSubscriptions || options.showActivity)
//	fcts = [fetchSubscriptions].concat(fcts);

// run the call chain
(function next(res) {
  var fct = fcts.shift();
  //console.time(fct.name);
  fct(res || options, function (res) {
    //console.timeEnd(fct.name);
    next(res || options);
  });
})();
