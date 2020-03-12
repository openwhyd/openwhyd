// const assert = require('assert');
const { detectTracks } = require('./../../public/js/bookmarklet.js');

describe('bookmarklet', function() {
  it('should initialize without error', async () => {
    detectTracks({
      window: {
        location: { href: '' },
        document: {
          title: '',
          getElementsByTagName: () => []
        }
      },
      ui: {
        addSearchThumb: () => {},
        finish: () => {}
      },
      urlDetectors: []
    });
  });
});
