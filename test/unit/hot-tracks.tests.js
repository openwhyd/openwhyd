const assert = require('assert');
const { getHotTracks } = require('../../app/features/hot-tracks.js');

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', async () => {
    const postedTrack = { eId: '1' };
    const getTracksByDescendingScore = () => Promise.resolve([postedTrack]);
    const fetchPostsByPid = () => Promise.resolve({});
    assert.deepEqual(
      await getHotTracks(getTracksByDescendingScore, fetchPostsByPid),
      [postedTrack]
    );
  });

  it('should list the track with higher score in first position, given two posted tracks with different scores', async () => {
    const regularTrack = { eId: '1', score: 1 };
    const bestTrack = { eId: '2', score: 2 };
    const getTracksByDescendingScore = () =>
      Promise.resolve([bestTrack, regularTrack]);
    const fetchPostsByPid = () => Promise.resolve({});
    assert.deepEqual(
      await getHotTracks(getTracksByDescendingScore, fetchPostsByPid),
      [bestTrack, regularTrack]
    );
  });
});
