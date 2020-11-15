const REGEX = /https:\/\/[^.]+\.bcbits\.com\/stream\/[^;"]*/g;

exports.extractBandcampStreamURLs = (plainText) => plainText.match(REGEX);

exports.extractBandcampStreamURLsFromHTML = (html) => {
  const withDecodedEntities = htmlDecode(html);
  return exports.extractBandcampStreamURLs(withDecodedEntities);
};

function htmlDecode(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

// TODO: add controller + make sure it's only callable from openwhyd.org
