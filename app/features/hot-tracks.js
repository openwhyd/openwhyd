const snip = require('../../app/snip.js');

const FIELDS_TO_SUM = {
  nbP: true, // number of plays
  nbL: true, // number of likes (from lov[] field)
  nbR: true, // number of posts/reposts
};

exports.FIELDS_TO_SUM = FIELDS_TO_SUM;

const FIELDS_TO_COPY = {
  name: true,
  img: true,
  score: true,
};

exports.FIELDS_TO_COPY = FIELDS_TO_COPY;

const fieldList = Object.keys(FIELDS_TO_COPY)
  .concat(Object.keys(FIELDS_TO_SUM))
  .concat(['prev']);

function mergePostData(track, post) {
  for (let f in fieldList) post[fieldList[f]] = track[fieldList[f]];
  post.trackId = track._id;
  post.rankIncr = track.prev - track.score;
  return post;
}

exports.getHotTracks = function (getTracksByDescendingScore, fetchPostsByPid) {
  // sorts tracks by descending score
  return getTracksByDescendingScore().then((tracks) => {
    var pidList = snip.objArrayToValueArray(tracks, 'pId');

    return fetchPostsByPid(pidList).then(function (posts) {
      var postsByEid = snip.objArrayToSet(posts, 'eId');
      for (let i in tracks) {
        var track = tracks[i];
        if (!track) {
          console.error('warning: skipping null track in track.getHotTracks()');
          continue;
        }
        var post = postsByEid[tracks[i].eId];
        if (!post) {
          //console.error("warning: skipping null post in track.getHotTracks()");
          continue;
        }
        tracks[i] = mergePostData(track, post);
      }
      return { tracks, postsByEid };
    });
  });
};
