// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  SoundCloudPlayer;
  VimeoPlayer;
  DailymotionPlayer;
  DeezerPlayer;
  BandcampPlayer;
  JamendoPlayer;
  closeWhydBk;
  onkeydownBackup;
  _initWhydBk;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Document {
  selection;
}

if (typeof exports === 'undefined') {
  // running from web browser only, not from Node.js
  (window._initWhydBk = async function () {
    // prevents bug in firefox 3
    if (undefined == window.console)
      window.console = {
        ...window.console,
        log: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
        info: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
        error:
          function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
        warn: function () {} /* eslint-disable-line @typescript-eslint/no-empty-function */,
      };

    console.log('-= openwhyd bookmarklet v2.6.1 =-');

    const FILENAME = '/js/bookmarklet.js';
    const CSS_FILEPATH = '/css/bookmarklet.css';

    // close the bookmarklet by pressing ESC

    window.onkeydownBackup =
      window.onkeydownBackup || window.document.onkeydown;

    const overflowBackup = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';

    window.closeWhydBk = function () {
      window.document.body.removeChild(
        window.document.getElementById('whydBookmarklet'),
      );
      window.document.onkeydown = window.onkeydownBackup;
      window.document.body.style.overflow = overflowBackup;
      delete window.onkeydownBackup;
      delete window.closeWhydBk;
    };

    window.document.onkeydown = (event) => {
      if (event.key === 'Esc') window.closeWhydBk();
    };

    // utility functions

    function findScriptHost(scriptPathName) {
      // TODO: use window.document.currentScript.src when IE becomes completely forgotten by humans
      const els = window.document.getElementsByTagName('script');
      for (let i = els.length - 1; i > -1; --i) {
        const whydPathPos = els[i].src.indexOf(scriptPathName);
        if (whydPathPos > -1) return els[i].src.substr(0, whydPathPos);
      }
    }

    function getSelText() {
      if (window.getSelection) {
        return window.getSelection();
      } else if (window.document.getSelection) {
        return window.document.getSelection();
      } else if (window.document.selection) {
        return window.document.selection.createRange().text;
      }
    }

    function include(src, cb?) {
      let inc, timer;
      if (src.split(/[#?]/)[0].split('.').pop().toLowerCase() == 'css') {
        inc = window.document.createElement('link');
        inc.rel = 'stylesheet';
        inc.type = 'text/css';
        inc.media = 'screen';
        inc.href = src;
      } else {
        inc = window.document.createElement('script');
        inc.onload = function () {
          timer = timer ? clearInterval(timer) : null;
          cb && cb();
        };
        const check = () => {
          if (
            inc.readyState &&
            (inc.readyState == 'loaded' ||
              inc.readyState == 'complete' ||
              inc.readyState == 4)
          )
            inc.onload();
        };
        timer = cb ? setInterval(check, 500) : undefined;
        inc.onreadystatechange = check;
        inc.type = 'text/javascript';
        inc.src = src;
      }
      window.document.getElementsByTagName('head')[0].appendChild(inc);
    }

    function imageToHD(track) {
      if (track.img) {
        if (track.eId.substr(1, 2) == 'yt') {
          const img =
            'https://img.youtube.com/vi/' +
            track.eId.substr(4).split('?')[0] +
            '/hqdefault.jpg';
          const i = new Image();
          i.onload = function () {
            if (i.height >= 120) {
              const oldImage = window.document.getElementById(track.id);
              if (oldImage) oldImage.style.backgroundImage = 'url(' + img + ')';
              else
                console.warn('failed to improve quality of thumb', {
                  track,
                  elementToReplace: oldImage,
                  newImgUrl: img,
                });
            }
          };
          i.src = img;
        } else if (track.eId.substr(1, 2) == 'sc')
          track.img = track.img.replace('-large', '-t300x300');
        else if (track.eId.indexOf('/dz/') == 0)
          track.img = track.img.replace(/\/image$/, '/image?size=480x640');
        else if (track.eId.indexOf('/ja/') == 0)
          track.img = track.img.replace(
            /\/covers\/1\.200\.jpg$/,
            '/covers/1.600.jpg',
          );
      }
      return track;
    }

    // user interface

    function BkUi() {
      this.nbTracks = 0;

      let div = window.document.getElementById('whydBookmarklet');
      if (!div) {
        window.document.body.appendChild(
          window.document.createElement('div'),
        ).id = 'whydBookmarklet';
        div = window.document.getElementById('whydBookmarklet');
      }

      div.innerHTML = [
        '<div id="whydOverlay"></div>',
        '<div id="whydHeader">',
        '<a target="_blank" href="' +
          urlPrefix +
          '"><img src="' +
          urlPrefix +
          '/images/logo-s.png"></a>',
        '<div onclick="closeWhydBk();" style="background-image:url(' +
          urlPrefix +
          '/images/bookmarklet_ic_close_Normal.png)"></div>',
        '</div>',
        '<div id="whydContent">',
        '<div id="whydLoading"></div>',
        '</div>',
      ].join('\n');

      function showForm(thumb) {
        const text = getSelText();
        const href =
          urlPrefix +
          '/post?v=2&' +
          'embed=' +
          (thumb.eId
            ? '1&eId=' + encodeURIComponent(thumb.eId)
            : encodeURIComponent(thumb.url)) +
          (thumb.title ? '&title=' + encodeURIComponent(thumb.title) : '') +
          '&refUrl=' +
          encodeURIComponent(window.location.href) +
          '&refTtl=' +
          encodeURIComponent(window.document.title) +
          (text ? '&text=' + encodeURIComponent(text) : '');
        const whydPop = window.open(
          href,
          'whydPop',
          'height=460,width=780,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no',
        );
        whydPop.focus();
        window.closeWhydBk();
      }

      function showSearch(searchQuery) {
        const whydPop = window.open(
          urlPrefix + '/search?q=' + encodeURIComponent(searchQuery),
          'whydSearch',
        );
        whydPop.focus();
        window.closeWhydBk();
      }

      function elt(attrs, children = []) {
        const div = window.document.createElement(attrs.tagName || 'div');
        if (attrs.tagName) delete attrs.tagName;
        if (attrs.img) {
          div.style.backgroundImage = 'url(' + attrs.img + ')';
          delete attrs.img;
        }
        for (const a in attrs) div.setAttribute(a, attrs[a]);
        for (let i = 0; i < (children || []).length; ++i)
          div.appendChild(children[i]);
        return div;
      }

      function selectThumb(e) {
        const tpn = this.parentNode;
        const selected = tpn.className.indexOf(' selected') > -1;
        tpn.className =
          tpn.className.replace(' selected', '') +
          (selected ? '' : ' selected');
        e.preventDefault();
      }

      function renderThumb(thumb) {
        const addBtn = elt({ class: 'whydCont' }, [
          elt({ class: 'whydContOvr' }),
          elt({
            class: 'whydAdd',
            img: urlPrefix + '/images/bookmarklet_ic_add_normal.png',
          }),
        ]);
        addBtn.onclick = thumb.onclick;
        const checkBox = elt({ class: 'whydSelect' }); //onclick: "var tpn=this.parentNode;tpn.className=tpn.className.replace(' selected','')+(tpn.className.indexOf(' selected')>-1?'':' selected');e.preventDefault();"
        checkBox.onclick = selectThumb;
        return elt(
          {
            id: thumb.id, // unique id generated by addThumb()
            class: 'whydThumb',
            'data-eid': thumb.eId,
            img: thumb.img || urlPrefix + '/images/cover-track.png',
          },
          [
            elt({ class: 'whydGrad' }),
            elt({ tagName: 'p' }, [document.createTextNode(thumb.title)]),
            elt({ class: 'whydSrcLogo', img: thumb.sourceLogo }),
            addBtn,
            checkBox,
          ],
        );
      }

      const contentDiv = window.document.getElementById('whydContent');

      this.addThumb = function (thumb) {
        thumb.id = 'whydThumb' + this.nbTracks++;
        thumb = imageToHD(thumb);
        thumb.onclick = thumb.onclick || (() => showForm(thumb));
        contentDiv.appendChild(renderThumb(thumb));
      };

      this.addSearchThumb = function (track) {
        const searchQuery = track.searchQuery || track.name || track.title;
        this.addThumb({
          title: searchQuery || 'Search Openwhyd',
          sourceLogo: urlPrefix + '/images/icon-search-from-bk.png',
          onclick: () => showSearch(searchQuery),
        });
      };

      this.finish = function () {
        window.document.getElementById('whydLoading').style.display = 'none';
      };

      return this;
    }

    // Additional detectors

    async function initPlayemPlayers(playemUrl) {
      if (!('Playem' in window)) {
        await new Promise((resolve) => include(playemUrl, resolve));
      } else {
        // wait for openwhydYouTubeExtractor to be loaded
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if ('openwhydYouTubeExtractor' in window) {
              clearInterval(interval);
              resolve(window.openwhydYouTubeExtractor);
            }
          }, 100);
        });
      }
      return {
        yt: openwhydYouTubeExtractor,
        sc: new window.SoundCloudPlayer({}),
        vi: new window.VimeoPlayer({}),
        dm: new window.DailymotionPlayer({}),
        dz: new window.DeezerPlayer({}),
        bc: new window.BandcampPlayer({}),
        ja: new window.JamendoPlayer({}),
      };
    }

    // Start up

    const urlPrefix = findScriptHost(FILENAME) || 'https://openwhyd.org',
      urlSuffix = '?' + new Date().getTime();

    console.info('loading bookmarklet stylesheet...');
    include(urlPrefix + CSS_FILEPATH + urlSuffix);
    console.info('loading PlayemJS...');
    const playemFile = /openwhyd\.org/.test(urlPrefix)
      ? 'playem-min.js'
      : 'playem-all.js';
    const playemUrl = urlPrefix + '/js/' + playemFile + urlSuffix;
    const players = await initPlayemPlayers(playemUrl);
    const bookmarklet = makeBookmarklet({
      pageDetectors: openwhydBkPageDetectors, // defined in bookmarkletPageDetectors.ts
    });
    bookmarklet.detectTracks({
      window,
      ui: BkUi(),
      urlDetectors: [makeFileDetector(), makeStreamDetector(players)], // defined in bookmarkletUrlDetectors.ts
      urlPrefix,
    });
  })();
}
