const assert = require('assert');

function getHotTracks() {
  return [{ eId: '1' }];
}

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', () => {
    const postedTrack = { eId: '1' };
    assert.deepEqual(getHotTracks(), [postedTrack]);
  });

  it('should list the track with higher score in first position, given two posted tracks with different scores', () => {
    const regularTrack = { eId: '1', score: 1 };
    const bestTrack = { eId: '2', score: 2 };
    assert.deepEqual(getHotTracks(), [bestTrack, regularTrack]);
  });
});
