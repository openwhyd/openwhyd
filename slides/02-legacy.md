```js
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
  //console.time(fct.name);
  fct(res || options, function (res) {
    //console.timeEnd(fct.name);
    next(res || options);
  });
})();
```

[→](03-def-legacy.md)
