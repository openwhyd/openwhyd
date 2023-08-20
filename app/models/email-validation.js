// http://www.regular-expressions.info/email.html
const emailCheck =
  /^[a-z0-9\u007F-\uffff!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

exports.validate = function (email) {
  if (!email) return email;
  if (typeof email != 'string') {
    console.error('(malicious?) non-string email:', email, new Error().stack);
    return '';
  }
  return emailCheck.test(email);
};
