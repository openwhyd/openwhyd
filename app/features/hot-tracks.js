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

exports.getHotTracks = async function (
  getTracksByDescendingScore,
  fetchPostsByPid,
) {
  const tracks = await getTracksByDescendingScore();
  const pidList = snip.objArrayToValueArray(tracks, 'pId');
  const posts = await fetchPostsByPid(pidList);
  // complete track items with additional metadata (from posts)
  return tracks.map((track) => {
    const post = posts.find(({ eId }) => eId === track.eId);
    return post ? mergePostData(track, post) : track;
  });
};
