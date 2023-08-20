/**
 * user session console
 * @author adrienjoly, whyd
 **/

const MyController = require('../../MyController.js');

const MAX_LEN_UA = 12;

const lastAccessPerUA = {}; // { user-agent -> { uid -> timestamp } }

const stripUserAgent = (userAgent) => userAgent.substr(0, MAX_LEN_UA);

exports.stripUserAgent = stripUserAgent;

exports.notifyUserActivity = function ({ userId, userAgent, startDate }) {
  if (!userId || !userAgent || !startDate) return;
  const ua = stripUserAgent(userAgent);
  (lastAccessPerUA[ua] = lastAccessPerUA[ua] || {})[userId] = startDate;
};

function filterByFreshness(d) {
  const now = Date.now();
  const filtered = {};
  for (const ua in lastAccessPerUA) {
    let users = 0; //[];
    const userAccess = lastAccessPerUA[ua];
    for (const uid in userAccess) {
      const t = userAccess[uid];
      if (now - t <= d) ++users;
      //users.push({id: uid, secondsAgo: (now - t) / 1000}) ;
    }
    filtered[ua] = users; //[users.length, users];
  }
  return {
    freshnessThreshold: d / 1000,
    activeUsers: filtered,
  };
}

const ACTIONS = {
  all: function (p, cb) {
    cb({ json: lastAccessPerUA });
  },
  '1mn': function (p, cb) {
    cb({ json: filterByFreshness(60 * 1000) });
  },
  '6mn': function (p, cb) {
    cb({ json: filterByFreshness(6 * 60 * 1000) });
  },
};

exports.controller = MyController.buildController({
  controllerName: 'admin.session',
  adminOnly: true,
  actions: ACTIONS,
});
