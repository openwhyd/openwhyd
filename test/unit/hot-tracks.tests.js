const assert = require('assert');

describe('hot tracks feature', () => {
  it('should list one track in first position, if just that track was posted', () => {
    const postedTrack = { eId: '1' };
    assert.deepEqual(getHotTracks(), [postedTrack]);
  });
});
