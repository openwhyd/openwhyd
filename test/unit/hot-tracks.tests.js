// @ts-check

// $ npx mocha test/unit/hot-tracks.tests.js

const assert = require('assert');
const { getHotTracks } = require('../../app/features/hot-tracks.js');

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', async () => {
    const postedTrack = { pId: 'pId1', eId: '1' };
    const getTracksByDescendingScore = async () => [postedTrack];
    assert.deepEqual(await getHotTracks(getTracksByDescendingScore), [
      postedTrack,
    ]);
  });

  it('should list the track with higher score in first position, given two posted tracks with different scores', async () => {
    const regularTrack = { pId: 'pId1', eId: '1', score: 1 };
    const bestTrack = { pId: 'pId2', eId: '2', score: 2 };
    const getTracksByDescendingScore = async () => [bestTrack, regularTrack];
    assert.deepEqual(await getHotTracks(getTracksByDescendingScore), [
      bestTrack,
      regularTrack,
    ]);
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
    const getTracksByDescendingScore = async () => [
      { ...posts[0], pId: posts[0]._id },
      { ...posts[1], pId: posts[1]._id },
    ];
    /** @type {any} */
    const hotTracks = await getHotTracks(getTracksByDescendingScore);
    assert.deepEqual(hotTracks[0].pl, posts[0].pl);
    assert.deepEqual(hotTracks[1].text, posts[1].text);
  });
});
