// usage: run from http://localhost:8080/admin/test
// TODO: turn this script into a proper integration test and move it outside of the app

var followModel = require('../../../models/follow.js');

exports.makeTests = function (p) {
  var testVars = {};

  return [
    [
      'fetchUserSubscriptions',
      function fetchSubscriptions(cb) {
        //console.time("fetchUserSubscriptions");
        followModel.fetchUserSubscriptions(
          p.loggedUser.id,
          function (subscriptions) {
            testVars.uidList = [p.loggedUser.id];
            for (let i in subscriptions.subscriptions)
              if (subscriptions.subscriptions[i].id)
                testVars.uidList.push(
                  ('' + subscriptions.subscriptions[i].id).replace('/u/', '')
                );
            //console.timeEnd("fetchUserSubscriptions");
            cb(true);
          }
        );
      },
    ],
    [
      'fetchSubscriptionArray == fetchUserSubscriptions',
      function fetchSubscriptions(cb) {
        //console.time("fetchSubscriptionArray");
        followModel.fetchSubscriptionArray(
          p.loggedUser.id,
          function (subscriptions) {
            subscriptions.push(p.loggedUser.id);
            //console.timeEnd("fetchSubscriptionArray");
            cb(subscriptions.sort().join() === testVars.uidList.sort().join());
          }
        );
      },
    ],
  ];
};
