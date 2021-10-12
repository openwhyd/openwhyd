```js
// AVANT

var fcts = [fetchAndRender, renderResponse];

if (!options.after && !options.before)
  // main tab: tracks (full layout to render, with sidebar)
  fcts = [
    fetchPlaylists,
    /*fetchSubscriptions,*/ fetchStats,
    fetchLikes,
    fetchNbTracks /*fetchSimilarity*/,
  ].concat(fcts);

// run the call chain
(function next(res) {
  var fct = fcts.shift();
  fct(res || options, function (res) {
    next(res || options);
  });
})();
```

[→](10-après.md)
