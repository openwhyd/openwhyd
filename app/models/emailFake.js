/**
 * fake email implementation (used by email.js generic wrapper)
 * display emails in the standard output
 * @author adrienjoly, whyd
 **/

// for when config.emailModule is not specified:
var fakeDeliveryDuration = 2000; // ms

//console.log("FAKE EMAIL ENABLED, duration: ", fakeDeliveryDuration, " milliseconds");

exports.email = function (
  emailAddr,
  subject,
  textContent,
  htmlContent,
  userName,
  callback,
) {
  /*
  console.log('FAKE EMAIL', {
    to: emailAddr,
    subject: subject,
    text: textContent,
    html: !!htmlContent,
  });
  */
  setTimeout(function () {
    var result = 'FAKE EMAIL => success';
    if (callback) callback(result);
  }, fakeDeliveryDuration);
};
// when config.emailModule is set, this method will be overidden (see at bottom)
