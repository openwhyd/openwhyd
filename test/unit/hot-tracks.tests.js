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

  it('should return tracks with post metadata', async () => {
    const posts = [
      {
        _id: '61e19a3f078b4c9934e72ce4',
        eId: '1',
        pl: { name: 'soundtrack of my life', id: 0 }, // metadata from the post that will be included in the list of hot tracks
      },
      {
        _id: '61e19a3f078b4c9934e72ce5',
        eId: '2',
        text: 'my favorite track ever!', // metadata from the post that will be included in the list of hot tracks
      },
    ];
    const tracks = [
      { eId: posts[0].eId, pId: posts[0]._id },
      { eId: posts[1].eId, pId: posts[1]._id },
    ];
    const getTracksByDescendingScore = () => Promise.resolve(tracks);
    const fetchPostsByPid = (pidList) =>
      Promise.resolve(posts.filter(({ _id }) => pidList.includes(_id)));
    const hotTracks = await getHotTracks(
      getTracksByDescendingScore,
      fetchPostsByPid
    );
    assert.deepEqual(hotTracks[0].pl, posts[0].pl);
    assert.deepEqual(hotTracks[1].text, posts[1].text);
  });
});
