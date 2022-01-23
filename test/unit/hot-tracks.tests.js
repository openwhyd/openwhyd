const assert = require('assert');
const { getHotTracks } = require('../../app/features/hot-tracks.js');

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', () => {
    const postedTrack = { eId: '1' };
    const getTracksByDescendingScore = () => Promise.resolve([postedTrack]);
    assert.deepEqual(getHotTracks(getTracksByDescendingScore), [postedTrack]);
  });

  it('should list the track with higher score in first position, given two posted tracks with different scores', () => {
    const regularTrack = { eId: '1', score: 1 };
    const bestTrack = { eId: '2', score: 2 };
    const getTracksByDescendingScore = () =>
      Promise.resolve([bestTrack, regularTrack]);
    assert.deepEqual(getHotTracks(getTracksByDescendingScore), [
      bestTrack,
      regularTrack,
    ]);
  });
});
