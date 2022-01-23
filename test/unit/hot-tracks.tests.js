const assert = require('assert');

function getHotTracks(getPostedTracks) {
  // sorts tracks by descending score
  return getPostedTracks().sort((a, b) => b.score - a.score);
}

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', () => {
    const postedTrack = { eId: '1' };
    const getPostedTracks = () => [postedTrack];
    assert.deepEqual(getHotTracks(getPostedTracks), [postedTrack]);
  });

  it('should list the track with higher score in first position, given two posted tracks with different scores', () => {
    const regularTrack = { eId: '1', score: 1 };
    const bestTrack = { eId: '2', score: 2 };
    const getPostedTracks = () => [regularTrack, bestTrack];
    assert.deepEqual(getHotTracks(getPostedTracks), [bestTrack, regularTrack]);
  });
});
