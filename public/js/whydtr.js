/* global ga */

// openwhyd tracking

window.Whyd = window.Whyd || {};

window.Whyd.tracking =
  window.Whyd.tracking ||
  (function (options) {
    options = options || {};

    const runsLocally = window.location.hostname !== 'openwhyd.org';
    let loggedUser = options.loggedUser || {};
    let uId = loggedUser._id || loggedUser.id;

    // tools

    const getWeekNumber = (function () {
      const MUL = 1000 * 60 * 60 * 24 * 7,
        FIRST_WEEK_DATE = new Date('Monday January 3, 2011 08:00');
      return function (date) {
        return date && Math.floor(1 + (date - FIRST_WEEK_DATE) / MUL);
      };
    })();

    function getDateFromObjectId(_id) {
      // cf http://stackoverflow.com/questions/6452021/getting-timestamp-from-mongodb-id
      return new Date(parseInt(('' + _id).substring(0, 8), 16) * 1000);
    }

    // private functions

    function injectGoogleAnalytics() {
      // console.log('injecting google analytics');
      (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        (i[r] =
          i[r] ||
          function () {
            (i[r].q = i[r].q || []).push(arguments);
          }),
          (i[r].l = 1 * new Date());
        (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
      })(
        window,
        document,
        'script',
        '//www.google-analytics.com/analytics.js',
        'ga',
      );
      ga('create', 'UA-83857066-1', /*'auto',*/ { alwaysSendReferrer: true });
      const electron = navigator.userAgent.match(/openwhyd-electron\/[^ ]*/);
      if (electron) {
        const electronVer = electron[0];
        console.log('running on', electronVer);
        ga('set', 'dataSource', electronVer);
        ga('set', 'appId', 'org.openwhyd.electron');
        ga('set', 'appName', 'Openwhyd Electron');
        ga('set', 'appVersion', electronVer.split('/')[1]);
      }
    }

    function gaSet(dim, val) {
      // console.log('[GA] set', dim, ':', val);
      try {
        ga('set', dim, val);
      } catch (e) {
        console.error('[GA] error:', e);
      }
    }

    function setUser() {
      gaSet('loggedIn', !!uId);
      gaSet('dimension1', !!uId);
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference
      if (uId) {
        const genDate = getDateFromObjectId(uId);
        gaSet('userId', uId); // standard ga property
        gaSet('dimension2', uId);
        gaSet('joinWeek', getWeekNumber(genDate));
        gaSet('dimension4', getWeekNumber(genDate));
        if (loggedUser && loggedUser.iRf) {
          gaSet('joinSource', loggedUser.iRf);
          gaSet('dimension5', loggedUser.iRf);
        }
        // source: http://danhilltech.tumblr.com/post/12509218078/startups-hacking-a-cohort-analysis-with-google
        // mgmt: https://www.google.com/analytics/web/#management/Settings/a23759101w46480794p46730353/%3Fm.page%3DCustomDimensions%26m-content-dimensionsContent.rowShow%3D10%26m-content-dimensionsContent.rowStart%3D0%26m-content-dimensionsContent.sortColumnId%3Dindex%26m-content-dimensionsContent.sortDescending%3Dfalse%26m-content.mode%3DLIST/
      }
    }
    /*
	function wrapMethod(name) {
		return function(a,b) {
			console.log("fake mixpanel."+name,a,b);
		};
	};

	window.mixpanel = {
		init: wrapMethod("init"),
		track: wrapMethod("track"),
		people: {
			set: wrapMethod("people.set"),
			identify: wrapMethod("people.identify")
		}
	};
	*/

    // init

    if (!runsLocally) injectGoogleAnalytics();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    else window.ga = function () {}; //console.log.bind(console, "[GA]"); // fake google analytics

    // exported methods

    this.sendPageview = function () {
      setTimeout(function () {
        const wlh = window.location.href;
        const path = wlh.substr(wlh.indexOf('/', 10));
        // https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
        //ga('send', 'pageview', path);
        ga('send', 'pageview', {
          page: path,
          title: document.title,
        });
      }, 1);
    };

    this._log = function (type, category, action, value) {
      // console.log('[GA] send', arguments);
      try {
        ga('send', type, category, action, value);
      } catch (e) {
        console.error('[GA] error:', e);
      }
    };

    this.log = function (action, value) {
      this._log('event', uId || '(visitor)', action, value);
      this._log('event', action); // redundant event, just for the sequence diagram there: for https://www.google.com/analytics/web/#report/content-engagement-flow/a23759101w46480794p46730353/%3F_.useg%3Dbuiltin1%2Cbuiltin2%26_r.engageMode%3Devents%26_r.screen%3D%2F/
    };

    this.logTrackPlay = function (pId) {
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
      this.log('play', pId);
      this._log('event', '(consumers)', uId || '(visitor)');
    };

    this.setLoggedUser = function (user) {
      loggedUser = options.loggedUser = user || {};
      uId = loggedUser._id || loggedUser.id;
      setUser();
    };

    this.signedUp = function (user) {
      this.setLoggedUser(user);
      this.log('Signed up');
      this.sendPageview();
    };

    // main code

    setUser();
    this.sendPageview();

    return this;
  })({ loggedUser: window.user });
