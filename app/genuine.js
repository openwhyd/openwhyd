/**
 * genuine signup token compiler and checker
 * tools to make sure that accounts can be created only from official openwhyd clients (iOS and web ui)
 * @author adrienjoly, whyd
 */

var crypto = require('crypto');

var GENUINE_SIGNUP_SECRET = process.env.WHYD_GENUINE_SIGNUP_SECRET.substr(), // secret key (only known by secure openwhyd clients), used to hash sTk
  TOKEN_EXPIRY = 1000 * 60 * 10; // 10 minutes

// hack caused by proxy on openwhyd server
function realIP(request) {
  var realIP = (request.headers || {})['x-real-ip'];
  return realIP ? { connection: { remoteAddress: realIP } } : request;
}

function signature(str, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(str)
    .digest('base64')
    .replace(/=$/, '');
}

function hashRequest(req, date) {
  return crypto
    .createHash('md5')
    .update(
      /*crypto.randomBytes(4).toString('hex') +*/ req.connection.remoteAddress +
        date,
    ) // remoteAddress: '74.125.127.100' or '2001:4860:a005::68'
    .digest('base64')
    .replace(/==$/, '');
}

function parseSignupToken(sTk) {
  // WARNING: magic numbers everywhere!
  return {
    hash: sTk.substr(0, 11 + 22),
    date: new Date(parseInt(sTk.substr(0, 11), 16)),
    requestHash: sTk.substr(11, 22),
    signature: sTk.substr(11 + 22, 11 + 22 + 21),
  };
}

//var date = Date.now() => 1419430780993; // 13 digits
//var hexDate = date.toString(16) => "14a7cabae02" // 11 hexadecimal chars
//parseInt(hexDate, 16)

// used directly by iOS app, indirectly by web ui (through request token validation)
exports.makeSignupToken = function (request, date) {
  request = realIP(request);
  //console.log("[genuine.makeSignupToken] request IP:", request.connection.remoteAddress);
  date = date ? new Date(date).getTime() : Date.now();
  var requestHash = hashRequest(request, date);
  var hash = date.toString(16) + requestHash;

  //console.log('date =>',  date.toString(16));
  //console.log('')
  var sign = signature(hash, GENUINE_SIGNUP_SECRET);
  /*
	console.log({
		hash: hash,
		date: new Date(date),
		requestHash: requestHash,
		signature: sign,
	});
	*/
  return hash + sign;
};

exports.validateSignupToken = function (sTk, request) {
  request = realIP(request);
  // console.log(
  //   '[genuine.validateSignupToken] request IP:',
  //   request.connection.remoteAddress
  // );
  var token = parseSignupToken(sTk);
  return {
    authentic: token.signature === signature(token.hash, GENUINE_SIGNUP_SECRET),
    notExpired: Date.now() - token.date < TOKEN_EXPIRY,
    sameAddr: token.requestHash === hashRequest(request, token.date.getTime()),
  };
  // TODO: check request's referer
};

// used by iOS app and backend of web ui
exports.checkSignupToken = function (sTk, request) {
  request = realIP(request);

  // console.log(
  //   '[genuine.checkSignupToken] request IP:',
  //   request.connection.remoteAddress
  // );
  var valid = exports.validateSignupToken(sTk, request);
  for (let i in valid) {
    // valid contains the following keys: authentic, notExpired, sameAddr
    if (!valid[i]) {
      return false;
    }
  }
  return true;
};

/*
function test(){
	function makeRequestFrom(remoteAddress){
		return { connection: { remoteAddress: remoteAddress } };
	}
	function testFrom(remoteAddress){
		var earlier = Date.now() - 1000 * 60; // 1 minute ago
		var expired = Date.now() - 1000 * 60 * 60; // 1 hour ago

		var req1 = makeRequestFrom(remoteAddress);
		var req2 = makeRequestFrom(remoteAddress+1);
		var sTk1 = exports.makeSignupToken(req1);
		var sTk2 = exports.makeSignupToken(req2);
		var sTk3 = exports.makeSignupToken(req1, earlier);
		var sTk4 = exports.makeSignupToken(req1, expired);
		var valid1 = exports.checkSignupToken(sTk1, req1);
		var valid2 = exports.checkSignupToken(sTk2, req1);
		var valid3 = exports.checkSignupToken(sTk3, req1);
		var valid4 = exports.checkSignupToken(sTk4, req1);

		// sTk2 : created at same time as sTk1, but from different IP address
		// sTk3 : created from same IP address as sTk1 but sign up 1 minute after token request
		// sTk4 : created from same IP address as sTk1 but at an expired time

		var result = valid1 && !valid2 && valid3 && !valid4;

		console.log(" - - - TEST");

		console.log("req1", req1)
		console.log("sTk1", sTk1)
		console.log("=> valid?", valid1); // should be true

		console.log("req2", req2)
		console.log("sTk2", sTk2)
		console.log("=> valid?", valid2); // should be false

		console.log("sTk3", sTk3)
		console.log("=> valid?", valid3); // should be true

		console.log("sTk4", sTk4)
		console.log("=> valid?", valid4); // should be false

		console.log(" - - - TEST success?", result);
	}
	testFrom('74.125.127.100');
	testFrom('2001:4860:a005::68'); // IP V6
}
test();
*/
