// Each detector is called once per web page and returns a list of Query, DomElement and/or Track objects.
// - Query objects must have a searchQuery field. They will be passed as-is to ui.addSearchThumb()
// - DomElement objects must have a href or src field.
// - DomElement and Track objects will be passed to urlDetectors, to complete their metadata if needed.
// TODO: simplify/homogenize return types
function makePageDetectors() {
  return [
    function detectYouTubePageTrack(window) {
      if (/ - YouTube$/.test(window.document.title) === false) return null;
      const videoElement = window.document.getElementsByTagName(
        'ytd-watch-flexy'
      )[0];
      if (!videoElement) return null;
      const videoId = videoElement.getAttribute('video-id');
      if (!videoId || window.location.href.indexOf(videoId) == -1) return null;
      return [
        {
          id: videoId,
          src: window.location.href,
          name: window.document.title.replace(/ - YouTube$/, ''),
        },
      ];
    },
    function detectPandoraTrack(window) {
      if (window.location.href.indexOf('pandora.com') == -1) return null;
      const getNodeText = (node) =>
        (node.innerText || node.textContent || '').trim().split('\n')[0]; // keep just the first line of text (useful for suggested YouTube links that include stats on following lines)
      // TODO: also use node.title and node.alt, like in makeFileDetector() and DetectEmbed() ?
      const artist = getNodeText(
          window.document.getElementsByClassName('playerBarArtist')[0] || {}
        ),
        title = getNodeText(
          window.document.getElementsByClassName('playerBarSong')[0] || {}
        );
      return artist && title
        ? [{ src: window.location.href, searchQuery: artist + ' - ' + title }]
        : [];
    },
    function detectDeezerTrack(window) {
      const dzTrackId = window.dzPlayer && window.dzPlayer.getSongId();
      return dzTrackId
        ? [{ src: 'https://www.deezer.com/track/' + dzTrackId }]
        : [];
    },
    function detectTrackFromTitle(window) {
      const title = window.document.title
        .replace(/[▶<>"']+/g, ' ')
        .replace(/[ ]+/g, ' ');
      const titleParts = [
        ' - Spotify',
        ' | www.deezer.com',
        ' - Xbox Music',
        ' - Royalty Free Music - Jamendo',
      ];
      for (let i = 0; i < titleParts.length; ++i)
        if (title.indexOf(titleParts[i]) > -1)
          return [
            {
              src: window.location.href,
              searchQuery: title.replace(titleParts[i], ''),
            },
          ];
    },
    function extractBandcampTracks(window) {
      let toDetect = [];
      const bc = window.TralbumData;
      if (bc) {
        const bcPrefix = '/bc/' + bc.url.split('//')[1].split('.')[0] + '/';
        toDetect = bc.trackinfo.map(function (tr) {
          if (tr.file) {
            const streamUrl = tr.file[Object.keys(tr.file)[0]];
            return {
              href: streamUrl,
              eId: bcPrefix + tr.title_link.split('/').pop() + '#' + streamUrl,
              name: bc.artist + ' - ' + tr.title,
              img: bc.art_id
                ? `https://f4.bcbits.com/img/a${bc.art_id}_16.jpg`
                : undefined,
              artist: bc.artist,
              title: tr.title,
            };
          }
        });
        if (toDetect.length) return toDetect;
      }
      // list Bandcamp track URLs
      let bandcampPageUrl =
        window.document.querySelector &&
        window.document.querySelector('meta[property="og:url"]');
      if (!bandcampPageUrl) return [];
      bandcampPageUrl = bandcampPageUrl.getAttribute('content');
      if (bandcampPageUrl.indexOf('bandcamp.com/track/') != -1)
        toDetect.push({ src: bandcampPageUrl });
      else {
        const pathPos = bandcampPageUrl.indexOf('/', 10);
        if (pathPos != -1) bandcampPageUrl = bandcampPageUrl.substr(0, pathPos); // remove path
        const elts = window.document.querySelectorAll('a[href^="/track/"]');
        for (let j = 0; j < elts.length; ++j)
          toDetect.push({
            href: bandcampPageUrl + elts[j].getAttribute('href'),
          });
      }

      return toDetect;
      // TODO: window.document.querySelectorAll('script[title*="bandcamp.com/download/track"]') // only works on track and album pages
    },
    function parseDomElements(window) {
      let results = [];
      ['iframe', 'object', 'embed', 'a', 'audio', 'source'].map(function (
        elName
      ) {
        results = results.concat(
          Array.prototype.slice.call(
            window.document.getElementsByTagName(elName)
          )
        );
      });
      return results;
    },
  ];
}

if (typeof exports !== 'undefined') {
  exports.pageDetectors = makePageDetectors();
} else {
  window.openwhydBkPageDetectors = makePageDetectors();
}
