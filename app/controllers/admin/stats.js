/**
 * stats admin console
 * @author adrienjoly, whyd
 **/

const mongodb = require('../../models/mongodb.js');
const snip = require('../../snip.js');
const FileController = require('./FileController.js');

function listBestContributors(cb) {
  const users = {};
  mongodb.forEach(
    'post',
    { fields: { _id: 0, uId: 1, uNm: 1 } },
    function (f) {
      users[f.uId] = users[f.uId] || { id: f.uId, name: f.uNm, c: 0 };
      users[f.uId].c++;
    },
    function () {
      cb(
        snip.mapToObjArray(users).sort(snip.makeFieldSort('c', snip.descSort)),
      );
    },
  );
}

function listTracksFromBookmarklet(p, cb) {
  const bkPosts = [];
  mongodb.forEach(
    'post',
    {
      q: { 'src.id': { $exists: true }, repost: { $exists: false } },
      fields: { _id: 1, uNm: 1, 'src.id': 1 },
    },
    function (post) {
      if (post && post.src.id)
        bkPosts.push({
          pId: '' + post._id,
          uNm: post.uNm,
          src: (post.src.id.split('/')[2] || post.src.id).replace('www.', ''),
        });
      //else console.log("[WARNING] invalid post", post)
    },
    cb,
    bkPosts,
  );
}

function listBookmarkletSources(p, cb) {
  listTracksFromBookmarklet(p, function (bkPosts) {
    let sources = {};
    bkPosts.map(function (post) {
      //sources[post.src] = (sources[post.src] || 0) + 1;
      const s = (sources[post.src] = sources[post.src] || { c: 0, u: {} });
      ++s.c;
      s.u[post.uNm] = (s.u[post.uNm] || 0) + 1;
    });
    for (const i in sources) sources[i].u = Object.keys(sources[i].u).length;
    sources = snip.mapToObjArray(sources, 'src' /*, "c"*/);
    sources = sources.sort(snip.makeFieldSort('c', snip.descSort));
    sources = sources.sort(snip.makeFieldSort('u', snip.descSort));
    cb(sources);
  });
}

const fileGenerators = {
  'bestContributors.html': function (p, cb) {
    listBestContributors(function (users) {
      const table = new snip.DataTable().fromMap(users);
      table.header = ['user id', 'user name', 'number of tracks'];
      cb({ html: table.toHtml() });
    });
  },
  'tracksFromBookmarklet.html': function (p, cb) {
    listTracksFromBookmarklet(p, function (bkPosts) {
      bkPosts = bkPosts.sort(snip.makeFieldSort('src', snip.ascSort));
      cb({ html: new snip.DataTable().fromMap(bkPosts).toHtml() });
    });
  },
  'tracksFromBookmarklet.csv': function (p, cb) {
    listTracksFromBookmarklet(p, function (bkPosts) {
      cb({ csv: new snip.DataTable().fromMap(bkPosts).toCsv() });
    });
  },
  'bookmarkletSources.html': function (p, cb) {
    listBookmarkletSources(p, function (sources) {
      const table = new snip.DataTable().fromMap(sources);
      table.header = ['source', 'tracks added', 'unique users'];
      cb({ html: table.toHtml() });
    });
  },
  'bookmarkletSources.csv': function (p, cb) {
    listBookmarkletSources(p, function (sources) {
      const table = new snip.DataTable().fromMap(sources);
      table.header = ['source', 'tracks added', 'unique users'];
      cb({ csv: table.toCsv() });
    });
  },
};

exports.controller = FileController.buildController({
  controllerName: 'admin.stats',
  adminOnly: true,
  fileGenerators: fileGenerators,
});
