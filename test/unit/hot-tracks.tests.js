const assert = require('assert');

function getHotTracks(postedTracks) {
  // sorts tracks by descending score
  return postedTracks.sort((a, b) => b.score - a.score);
}

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', () => {
    const postedTrack = { eId: '1' };
    const postedTracks = [postedTrack];
    assert.deepEqual(getHotTracks(postedTracks), [postedTrack]);
  });

  it('should list the track with higher score in first position, given two posted tracks with different scores', () => {
    const regularTrack = { eId: '1', score: 1 };
    const bestTrack = { eId: '2', score: 2 };
    const postedTracks = [regularTrack, bestTrack];
    assert.deepEqual(getHotTracks(postedTracks), [bestTrack, regularTrack]);
  });
});
