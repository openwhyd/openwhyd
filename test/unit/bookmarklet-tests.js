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

/**
 * How to manually test the bookmarklet, in a web browser
 * 
   // 1. Go to the /all page (because it always shows at least one video)
   window.location.href = 'http://localhost:8080/all';
   
   // 2. Load the local bookmarket, using the JavaScript console:
   window.document.body.appendChild(
     window.document.createElement('script')
   ).src = `http://localhost:8080/js/bookmarklet.js?${Date.now()}`;
 *
 **/
