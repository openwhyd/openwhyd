```js
// APRES

if (feedOptions.mustRenderWholeProfilePage(options)) {
  options.user.pl = await fetchPlaylists(options);
  options.user.nbLikes = await fetchLikes(options);
  options.user.isSubscribed = await isSubscribed(options);
  options.user.nbTracks = renderCount(await fetchNbTracks(options));
  options.subscriptions = await fetchSubscriptions(options);
}

const feed = await fetchAndRender(options);
renderResponse(feed); // calls lib.render*()
```

[→](11-résultats.md)
