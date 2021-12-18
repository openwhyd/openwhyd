/**
 * apple push notification system (APNS)
 **/

var apn = require('apn');

var prod =
  !process.appParams.dev &&
  process.appParams.urlPrefix.indexOf('openwhyd.org') > 1;

// cf https://github.com/argon/node-apn/blob/master/doc/apn.markdown
var CONN_OPTIONS = {
  cert:
    __dirname +
    '/../../config/apns/aps_' +
    (prod ? 'prod' : 'dev') +
    '.cert.pem',
  key:
    __dirname +
    '/../../config/apns/aps_' +
    (prod ? 'prod' : 'dev') +
    '.key.pem',
  passphrase: prod
    ? process.env.WHYD_APNS_PASSPHRASE.substr()
    : process.env.WHYD_DEV_APNS_PASSPHRASE.substr(),
  gateway: prod ? 'gateway.push.apple.com' : 'gateway.sandbox.push.apple.com',
  port: 2195,
  production: prod, // by default: false unless the NODE_ENV environment variable is set to "production"
};

//console.log("[APNS] parameters:", CONN_OPTIONS);

var DEFAULT_EXPIRY = 24 * 60 * 60; // 1 day
var DEFAULT_BADGE = 0;
var DEFAULT_SOUND = 'ping.aiff';

//console.log("[APNS] Connecting...");
var apnConnection = apn.Connection(CONN_OPTIONS);

// listen to all events

apnConnection.on('connected', function () {
  console.log('[APNS] is connected');
});

apnConnection.on('transmitted', function (data, dest) {
  console.log(
    '[APNS] transmitted:',
    (data || {}).compiledPayload,
    'to',
    (dest || {}).token || '(unknown)'
  );
});

['transmissionError', 'disconnected'].forEach(function (evt) {
  apnConnection.on(evt, function () {
    console.log('[APNS]', evt, 'event:', arguments);
  });
});

['error', 'socketError', 'timeout', 'cacheTooSmall'].forEach(function (evt) {
  apnConnection.on(evt, function () {
    console.error('[APNS]', evt, 'event:', arguments);
  });
});

exports.sendApplePushNotification = function (device, data) {
  console.log('[APNS] Sending notif:', data);
  var note = new apn.Notification();
  for (let i in data) note[i] = data[i];
  return apnConnection.pushNotification(note, device);
};

exports.pushToDevice = function (token, text, payload) {
  payload = payload || {};
  var badge = DEFAULT_BADGE;
  if (payload.badge) {
    badge = payload.badge;
    delete payload.badge;
  }
  exports.sendApplePushNotification(new apn.Device(token), {
    expiry: Math.floor(Date.now() / 1000) + DEFAULT_EXPIRY,
    badge: badge,
    sound: DEFAULT_SOUND,
    alert: text,
    payload: payload,
  });
};
/*
(function ApnsFeedbackMonitor(){
	for (let i in CONN_OPTIONS)
		FEEDBACK_OPTIONS[i] = CONN_OPTIONS[i];
	console.log("Listening to APNS feedback...");
	var feedback = new apn.Feedback(FEEDBACK_OPTIONS);
	feedback.on("feedback", function(devices) {
		devices.forEach(function(item) {
			// Do something with item.device and item.time;
			console.log("[APNS Feedback]", item);
			// " Use the timestamp to verify that the device tokens haven’t been reregistered since the feedback entry was generated.
			// For each device that has not been reregistered, stop sending notifications."
			// => you should record the timestemp when a device registers with your service along with the token and update it
			// every time your app re-registers the token. When the feedback service returns a token with an associated timestamp
			// which is newer than that stored by you then you should disable, or remove, the token from your system and stop
			// sending notifications to it.
			// cf https://github.com/argon/node-apn/blob/master/doc/apn.markdown#using-the-feedback-data
		});
	});
	feedback.on("feedbackError", function(error) {
		console.log("[APNS Feedback] feedbackError:", error);
	});
	feedback.on("error", function(error) {
		console.log("[APNS Feedback] error:", error, error.stack);
	});
})();
*/
// tests: use /admin/test/notif, logged as Adrien (or another user which device token is listed on /app/models/notif.js)
/*
var DEVICE_DAMIEN_DEV = "9d00c19b 189932bb 12d3214e 025a3bc4 09a385b7 19880ee1 6cd3d837 25703227".replace(/ /g, "");
var DEVICE_ADRIEN_DEV = "07e3570a 8393f53e b868f627 766ea900 88c243a2 4f842051 769ad757 4ed10d7b".replace(/ /g, "");
var DEVICE_ADRIEN_PROD = "a22148e1b9b5365f75a35d8c869fff4b752ad2a5727060928b8d70a23e841359";
exports.pushToDevice(DEVICE_ADRIEN_DEV, (prod ? "prod" : "dev") + " mode - dev token", {'messageFrom': 'Whyd'});
exports.pushToDevice(DEVICE_ADRIEN_PROD, (prod ? "prod" : "dev") + " mode - prod token", {'messageFrom': 'Whyd'});
*/
