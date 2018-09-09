var mongodb = require('mongodb'); //require('node-mongodb-native/lib/mongodb');

//==============================================================================
function SessionMongo(options) {
  typeof options === 'object' || (options = {});

  var self = this;
  var db =
    'mongodb://' +
    (options.user && options.password
      ? options.user + ':' + options.password + '@'
      : '') +
    (options.host || 'localhost') +
    ':' +
    (options.port || 27017) +
    '/' +
    (options.database || options.db || ''); // + "?w=0";

  this.pendingRequests = [];

  mongodb.connect(
    db,
    { w: 0 },
    function(err, db) {
      // write concern is disabled
      if (err) throw err;
      db.collection(options.collection || 'session', function(err, collection) {
        if (err) throw err;
        self.collection = collection;
        for (var i = 0, request; (request = self.pendingRequests[i]); i++) {
          collection[request.action].apply(collection, request.args);
        }
      });
    }
  );

  if (options.cleanEvery === 'week')
    options.cleanEvery = 7 * 24 * 60 * 60 * 1000;
  if (options.cleanEvery === 'day') options.cleanEvery = 24 * 60 * 60 * 1000;
  if (options.cleanEvery === 'hour') options.cleanEvery = 60 * 60 * 1000;

  if (typeof options.cleanEvery === 'number') {
    setTimeout(function() {
      if (self.collection)
        self.collection.remove(
          { 'cookie.expires': { $lte: Date.now() } },
          { w: 0 }
        );
    }, options.cleanEvery);
  }
}

//==============================================================================
SessionMongo.prototype.get = function(id, cb) {
  var callback = function(_, session) {
    if (session) delete session._id;
    cb(session);
  };
  this.collection
    ? this.collection.findOne({ _id: id }, callback)
    : this.pendingRequests.push({
        action: 'findOne',
        args: [{ _id: id }, callback]
      });
};

//==============================================================================
SessionMongo.prototype.set = function(id, session) {
  if (id) {
    session._id = id;
    this.collection
      ? this.collection.save(session, { w: 0 })
      : this.pendingRequests.push({ action: 'save', args: [session] });
  }
};

//==============================================================================
SessionMongo.prototype.remove = function(id) {
  if (id) {
    this.collection
      ? this.collection.remove({ _id: id }, {}, function() {})
      : this.pendingRequests.push({ action: 'remove', args: [{ _id: id }] });
  }
};

//==============================================================================
module.exports = SessionMongo;
