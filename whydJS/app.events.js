var fs = require('fs');
var email = require('emailjs');

//==============================================================================
var lastError = '';

// TODO: find another way to notify of crashes

var smtpServerOptions = {
  user: 'whyd.crash',
  password: 'TODO_SET_PASSWORD_HERE',
  host: 'smtp.gmail.com',
  ssl: true
};

var emailOptions = {
  from: 'whyd.crash@gmail.com',
  to: process.env.WHYD_CRASH_EMAIL.substr() // mandatory
};

var maxEmails = 10;

var nbMails = 0;

//==============================================================================
exports.stderr = function(errorChunk) {
  lastError += errorChunk;
};

//==============================================================================
exports.restart = function() {
  if (nbMails++ < maxEmails) {
    email.server.connect(smtpServerOptions).send({
      from: emailOptions.from,
      to: emailOptions.to,
      cc: emailOptions.cc,
      subject: 'CRASH',
      text: getLastLines(lastError, 40)
    });
  }
  lastError = '';
};

//==============================================================================
function getLastLines(str, n) {
  var arr = str.split('\n');
  var result = [];
  var len = Math.min(arr.length, n);
  for (var i = 0; i < len; i++) {
    result.unshift(arr.pop());
  }
  return result.join('\n');
}
