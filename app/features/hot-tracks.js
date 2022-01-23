exports.getHotTracks = function (getPostedTracks) {
  // sorts tracks by descending score
  return getPostedTracks().sort((a, b) => b.score - a.score);
};
