/**
 * search controller
 * uses the search index to return posts, users and playlists
 * @author adrienjoly, whyd
 **/

const config = require('../../models/config.js');
const mongodb = require('../../models/mongodb.js');
const searchModel = require('../../models/search.js');
const postModel = require('../../models/post.js');
const followModel = require('../../models/follow.js');
const template = require('../../templates/search.js');

const ObjectId = mongodb.ObjectId;

const MAX_RESULTS = 100;
const MAX_PLAYLIST_THUMBS = 3;
const MAX_IN_ADD_RESULTS = 5;
const MAX_NB_MENTION_SUGGESTIONS = 6;

/** submits a query and returns results as {post:[], user:[], playlist:[]} **/
function fetchResultsPerType(q, cb) {
  searchModel.query(q, function (r) {
    const resultsPerType = {};
    if (r && r.hits)
      for (const i in r.hits) {
        const item = r.hits[i];
        resultsPerType[item._type] = resultsPerType[item._type] || [];
        resultsPerType[item._type].push(template.makeResultObject(item));
      }
    cb(resultsPerType);
  });
}

function toObjectIdList(hits) {
  const idList = [];
  if (hits)
    for (const i in hits)
      idList.push(ObjectId('' + (hits[i]._id || hits[i].id)));
  return idList;
}

function removeDuplicates(posts) {
  const finalPosts = [],
    eidSet = {};
  for (const i in posts)
    if (!eidSet[posts[i].eId]) {
      finalPosts.push(posts[i]);
      eidSet[posts[i].eId] = true;
    }
  return finalPosts;
}

function removeEmptyItems(posts) {
  const finalPosts = [];
  for (const i in posts) if (posts[i]) finalPosts.push(posts[i]);
  return finalPosts;
}

/** fetch extended posts/users/playlists data from db, given a list of simple result objects **/
const fetchDataByType = {
  track: function (hits, cb) {
    this.post(hits, cb);
    // same as below
  },
  post: function (hits, cb) {
    const idList = toObjectIdList(hits);
    postModel.fetchPosts(
      { _id: { $in: idList } },
      {},
      { limit: MAX_RESULTS },
      function (items) {
        //sort items by search score
        const itemSet = {};
        for (const i in items)
          if (items[i]) itemSet['' + items[i]._id] = items[i];
        items = [];
        for (const i in idList) items.push(itemSet['' + idList[i]]);
        cb(items);
      },
    );
  },
  user: function (hits, cb) {
    // for each user, fetch last track
    //userModel.fetchMulti({_id:{$in:idList}}, {limit: MAX_RESULTS}, cb);
    const idList = toObjectIdList(hits);
    const userList = [];
    function next() {
      if (!idList.length) return cb(userList);
      const uid = '' + idList.shift();
      postModel.fetchByAuthors([uid], { limit: 1 }, async function (posts) {
        const userModel = require('../../models/user.js');
        const user = await userModel.fetchAndProcessUserById(uid);
        if (user)
          userList.push({
            _id: uid,
            name: user.name,
            lastTrack: (posts || []).length ? posts[0] : undefined,
          });
        next();
      });
    }
    next();
  },
  playlist: function (hits, cb) {
    // for each playlist, fetch number of tracks and 3 last tracks (for thumbs)
    const playlists = (hits || []).slice();
    const result = [];
    for (const i in playlists)
      playlists[i].idParts = ('' + (playlists[i]._id || playlists[i].id)).split(
        '_',
      );
    function next(i) {
      if (i >= playlists.length) return cb(result);
      const pl = playlists[i];
      postModel.countPlaylistPosts(pl.idParts[0], pl.idParts[1], function (c) {
        if (!c) next(i + 1);
        else {
          playlists[i]._id = pl.idParts[1];
          playlists[i].nbTracks = c;
          playlists[i].author = mongodb.getPublicProfileFromId(pl.idParts[0]);

          postModel.fetchPlaylistPosts(
            pl.idParts[0],
            pl.idParts[1],
            { limit: MAX_PLAYLIST_THUMBS - 1 },
            function (posts) {
              for (const j in posts)
                if (posts[j].img)
                  posts[j].img = posts[j].img.replace('http:', '');
              playlists[i].lastPosts = posts;
              result.push(playlists[i]);
              next(i + 1);
            },
          );
        }
      });
    }
    next(0);
  },
};

function sortByDecreasingScore(a, b) {
  return b.score - a.score;
}

/** re-order posts/users/playlists based on data quality/quantity and subscriptions **/
const sortByType = {
  track: function (items) {
    return items;
    // no sorting (algolia does it)
  },
  post: function (items, myUid, followedUids) {
    for (const i in items) {
      if (!items[i]) continue;
      items[i].isSubscribed = !!followedUids[items[i].uId];
      items[i].score =
        0 +
        2 * (items[i].uId == myUid) +
        items[i].isSubscribed +
        (items[i].nbLikes > 1);
    }
    items.sort(sortByDecreasingScore);
    return items;
  },
  user: function (items, myUid, followedUids) {
    for (const i in items) {
      if (!items[i]) continue;
      items[i].isSubscribed = !!followedUids['' + items[i]._id];
      items[i].score =
        0 + !!items[i].img + items[i].isSubscribed + !!items[i].lastTrack;
    }
    items.sort(sortByDecreasingScore);
    return items;
  },
  playlist: function (items, myUid, followedUids) {
    for (const i in items) {
      if (!items[i]) continue;
      items[i].isSubscribed = !!followedUids[items[i].idParts[0]];
      items[i].score =
        0 +
        (2 * (items[i].idParts[0] == myUid) + items[i].isSubscribed + 1) *
          items[i].nbTracks;
    }
    items.sort(sortByDecreasingScore);
    return items;
  },
};

function processPosts(results, params, cb) {
  params = params || {};
  if (!results || !results.length) return cb([]);
  fetchDataByType['post'](results, function (posts = []) {
    if (!posts.length) return cb([]);
    function populateSortAndReturn(followedUids) {
      function mapping(p) {
        return {
          id: p._id,
          eId: p.eId,
          url: config.translateEidToUrl(p.eId),
          img: p.img,
          name: p.name,
          uId: p.uId,
          uNm: p.uNm,
          score: followedUids[p.uId] ? 10 : 0,
        };
      }
      cb(
        removeDuplicates(removeEmptyItems(posts))
          .map(mapping)
          .sort(sortByDecreasingScore)
          .slice(0, params.limit || MAX_IN_ADD_RESULTS),
      );
    }
    if (params.uid)
      followModel.fetchSubscriptionSet(params.uid, populateSortAndReturn);
    else populateSortAndReturn({});
  });
}

//========================
// index query helpers

function fetchMyPosts(q, uid, cb) {
  searchModel.query(
    {
      _type: 'post',
      q: q,
      uId: uid,
      limit: MAX_IN_ADD_RESULTS * 2,
    },
    cb,
  );
}

function fetchTheirPosts(q, uid, cb) {
  searchModel.query(
    {
      _type: 'post',
      q: q,
      excludeUid: uid,
      limit: MAX_IN_ADD_RESULTS * 2,
      //sort: [/*{_score: "desc"},*/ {_uid:{order: "asc", ignore_unmapped: true}}]
    },
    cb,
  );
}

function fetchSearchPage(myUid, q, cb) {
  fetchResultsPerType({ q: q }, function (resultsPerType) {
    followModel.fetchSubscriptionSet(myUid, function (followedUids) {
      const types = ['user', 'playlist'];
      const results = {};
      (function next() {
        if (!types.length) {
          return cb(results);
        }
        const type = types.pop();
        fetchDataByType[type](resultsPerType[type], function (items) {
          sortByType[type](items, myUid, followedUids);
          results[type + 's'] = items;
          next();
        });
      })();
    });
  });
}

exports.controller = async function (request, reqParams = {}, response) {
  function renderSearchPage(q, cb) {
    fetchSearchPage(request.getUid(), q, function (results) {
      results.posts = results.tracks; // since algolia integration
      if (reqParams.format == 'json') cb({ q: q, results: results });
      else template.renderSearchPage(results, reqParams, cb);
    });
  }

  function renderResultsBox(q, format, cb) {
    fetchResultsPerType({ q: q }, function (resultsPerType) {
      resultsPerType.posts = resultsPerType.tracks; // since algolia integration
      if (format == 'html') template.renderResultBox(q, resultsPerType, cb);
      else cb({ q: q, results: resultsPerType });
    });
  }

  function fetchQuickResults(uid, q, cb) {
    if (!uid) {
      console.log('user is not logged in');
      cb({ error: 'you must be logged in to use that feature' });
    } else
      fetchMyPosts(q, uid, function (myResults) {
        //console.log("myResults", myResults);
        fetchTheirPosts(q, uid, function (theirResults) {
          //console.log("theirResults", myResults);
          processPosts(
            (theirResults || {}).hits,
            { uid: uid },
            function (theirPosts) {
              processPosts((myResults || {}).hits, {}, function (myPosts) {
                cb({
                  q: q,
                  results: {
                    myPosts: myPosts,
                    theirPosts: theirPosts,
                  },
                });
              });
            },
          );
        });
      });
  }

  function renderFilteredFeed(uid, q, cb) {
    searchModel.query({ q: q, uId: uid }, function (results) {
      // uid is provided => only posts results will be returned
      fetchDataByType['post']((results || {}).hits || [], function (posts) {
        if (reqParams.format == 'html')
          template.renderPosts(posts, reqParams.loggedUser, cb);
        else cb({ q: q, uId: uid, results: posts });
      });
    });
  }

  function fetchOtherTracks(uid, q, cb) {
    console.log('fetchOtherTracks', uid, q);
    fetchTheirPosts(q, uid, function (_results = {}) {
      const results = _results.hits || [];
      processPosts(results, { uid: uid }, function (posts) {
        cb(posts);
      });
    });
  }

  function fetchQuickUsers(uid, q, cb) {
    followModel.fetchSubscriptionSet(uid, function (followed) {
      const sorted = [];
      searchModel.query(
        { _type: 'user', q: reqParams.q, limit: MAX_NB_MENTION_SUGGESTIONS },
        function (users) {
          const hits = users?.hits || [];
          for (let i = hits.length - 1; i > -1; --i) {
            const u = hits[i];
            sorted[followed[u._id] ? 'unshift' : 'push'](u);
          }
          cb({ hits: sorted });
        },
      );
    });
    // TODO: boost matches by handle
  }

  // FINAL RENDERING

  const renderHTML = response.renderHTML.bind(response);
  const renderJSON = response.renderJSON.bind(response);

  function render(data) {
    return (reqParams.format == 'json' ? renderJSON : renderHTML)(data);
  }

  request.logToConsole('search.controller', reqParams);
  reqParams.loggedUser = await request.getUser();

  // track filter (from user profile)
  if (reqParams.q && reqParams.uid)
    renderFilteredFeed(reqParams.uid, reqParams.q, render);
  // mentions (for comments)
  else if (reqParams.q && reqParams.context == 'mention')
    fetchQuickUsers((reqParams.loggedUser || {}).id, reqParams.q, renderJSON);
  // tracks posted by other users (from add track dialog)
  else if (reqParams.q && reqParams.context == 'addTrack')
    fetchOtherTracks((reqParams.loggedUser || {}).id, reqParams.q, renderJSON);
  // prevent crash
  // combination of tracks posted by me and other users (from /mobile web interface)
  else if (reqParams.q && reqParams.context == 'quick')
    fetchQuickResults((reqParams.loggedUser || {}).id, reqParams.q, renderJSON);
  // quick/autocomplete search (from header bar)
  else if (reqParams.q && reqParams.context == 'header')
    renderResultsBox(reqParams.q, reqParams.format, render);
  // main search (triggered from header bar)
  else if (reqParams.q) renderSearchPage(reqParams.q, render);
  // main search page (default case)
  else template.renderSearchPage(null, reqParams, renderHTML);
};
