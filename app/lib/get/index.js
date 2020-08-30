var url = require('url');
var http = require('http');
var https = require('https');
var path = require('path');
var iconv = require('iconv'); //'iconv-jp'

var CHARSET_REG = /<meta[^<>]+charset\s*=\s*(?:"([^<>"]+)"|([^<>"\s]+))[^<>]*>/;
var TITLE_REG = /<title>([^<>]*)<\/title>/;
var BASE_REG = /<base[^<>]+href\s*=\s*"([^"]*)"[^<>]*>/;
var OG_IMAGE_REG = /<meta[^<>]+property\s*=\s*"og:image"[^<>]+content\s*=\s*"([^"]*)"[^<>]*>/;
var IMAGE_REG = /<img[^<>]+src\s*=\s*"[^"]*"/gi;
var IMAGE_URL_REG = /<img[^<>]+src\s*=\s*"([^"]*)"/i;
var MP3_REG = /<a\s+[^<>]*href\s*=\s*"[^"]*\.mp3"/gi;
var MP3_URL_REG = /<a\s+[^<>]*href\s*=\s*"([^"]*\.mp3)"/i;
//var EMBED_REG = /<a\s+[^<>]*href\s*=\s*"[^"]*\.mp3"/gi;
var EMBED_REG = /<(iframe|object|embed|a)?\s+[^<>]*(href|src|data)\s*=\s*"([^"]*)"/gi;
var CONTENT_TYPE_REG = /([^\s;]+)/;

//------------------------------------------------------------------------------

function ContentEmbedWrapper() {
  var ContentEmbed = require('../../../public/js/ContentEmbed.js');
  this.embed = ContentEmbed();
}

ContentEmbedWrapper.prototype.extractEmbedRef = function (url, callback) {
  /*var timeout = setTimeout(function(){
    console.log("ContentEmbedWrapper.extractEmbedRef timeout");
    callback({error:"timeout", url: url});
  }, 5000);*/
  this.embed.extractEmbedRef(url, function (embedRef) {
    //clearTimeout(timeout);
    callback(embedRef);
  });
};

var embedDetector = new ContentEmbedWrapper();

//==============================================================================
function Page(host, path, text) {
  this.host = host;
  this.path = path;
  this.text = text;
}

//==============================================================================
Page.prototype.find = function (regEx) {
  //return regEx.test(this.text) ? RegExp.$1.toString('utf8') : '';
  return this.text.match(regEx) || [];
};

//==============================================================================
Page.prototype.getTitle = function () {
  return TITLE_REG.test(this.text) ? RegExp.$1.toString('utf8') : '';
};

//==============================================================================
Page.prototype.getImages = function () {
  var imgs = this.text.match(IMAGE_REG) || [];
  var imgsUniq = [];
  var base = BASE_REG.test(this.text) ? RegExp.$1 : null;
  var ogImage = OG_IMAGE_REG.test(this.text) ? RegExp.$1 : null;
  var i, len, img;
  for (i = 0, len = imgs.length; i < len; i++) {
    img = imgs[i].match(IMAGE_URL_REG)[1];
    if (img.substr(0, 7) !== 'http://') {
      if (base) img = path.normalize(base + '/' + img);
      else
        img =
          'http://' +
          path.normalize(
            img.charAt(0) === '/'
              ? this.host + '/' + img
              : this.host + '/' + this.path + '/' + img
          );
    }
    imgs[i] = img;
  }
  ogImage && imgs.unshift(ogImage);
  for (i = 0; (img = imgs[i]); i++)
    if (imgsUniq.indexOf(img) === -1) imgsUniq.push(img);
  return imgsUniq;
};

//==============================================================================
Page.prototype.getMp3s = function () {
  var mp3s = this.text.match(MP3_REG) || [];
  var mp3sUniq = [];
  var base = BASE_REG.test(this.text) ? RegExp.$1 : null;
  var i, len, mp3;
  for (i = 0, len = mp3s.length; i < len; i++) {
    mp3 = mp3s[i].match(MP3_URL_REG)[1];
    if (mp3.substr(0, 7) !== 'http://') {
      if (base) mp3 = path.normalize(base + '/' + mp3);
      else
        mp3 =
          'http://' +
          path.normalize(
            mp3.charAt(0) === '/'
              ? this.host + '/' + mp3
              : this.host + '/' + this.path + '/' + mp3
          );
    }
    mp3s[i] = mp3;
  }
  for (i = 0; (mp3 = mp3s[i]); i++)
    if (mp3sUniq.indexOf(mp3) === -1) mp3sUniq.push(mp3);
  return mp3sUniq;
};

//==============================================================================
Page.prototype.extractEmbeds = function (cb) {
  var embedUrls = [];
  //console.log("looking for embeds in html page", this.text);
  // step 1: parse embed urls from the html page
  var embed = true;
  while (embed) {
    embed = EMBED_REG.exec(this.text);
    if (embed && embed.length) {
      embed.shift(); // first item of the array: wholeElement
      embed.shift(); // second item of the array: elementName
      while (embed.length > 1) {
        embed.shift(); // attr
        const val = embed.shift();
        if (val && embedUrls.indexOf(val) === -1) {
          embedUrls.push(val);
          //console.log("detected", elementName, attr, val);
        }
      }
    }
  }
  var embedRefs = [],
    remaining = embedUrls.length;
  if (!remaining) return cb(embedRefs);
  // step 2: extract recognized embeds from urls
  for (let i in embedUrls)
    embedDetector.extractEmbedRef(embedUrls[i], function (embedRef) {
      //console.log("url", url/*, embedRef*/);
      if (embedRef && embedRef.id)
        embedRefs.push({
          id: embedRef.id,
          name:
            embedRef.name && embedRef.name != 'undefined'
              ? embedRef.name
              : null,
          url: embedRef.url,
        });
      if (!--remaining) return cb(embedRefs);
    });
};

//==============================================================================
function getPage(address, callback) {
  var urlObj = url.parse(address);
  var options = {
    host: urlObj.hostname,
    path: urlObj.pathname,
    port: urlObj.port || 80,
  };
  var chunks = [];
  var length = 0;
  return http
    .get(options, function (res) {
      var headers = res.headers;
      var location = headers.Location || headers.location;
      res.on('error', callback);
      if (location) {
        options.path = location;
        http.get(options, arguments.callee).on('error', callback).end();
      } else {
        res.on('data', function (chunk) {
          chunks.push(chunk);
          length += chunk.length;
        });
        res.on('end', function () {
          var buffer = new Buffer(length);
          var bufferPos = 0;
          var i, chunk, text, charset;
          for (i = 0; (chunk = chunks[i]); i++) {
            chunk.copy(buffer, bufferPos);
            bufferPos += chunk.length;
          }
          text = buffer.toString();
          charset = CHARSET_REG.test(text)
            ? (RegExp.$1 || RegExp.$2).toLowerCase()
            : 'utf-8';
          if (charset !== 'utf-8')
            try {
              text = new iconv.Iconv(charset, 'utf-8')
                .convert(buffer)
                .toString('utf8');
            } catch (e) {
              console.error(e);
            }
          callback(null, new Page(urlObj.host, urlObj.path, text));
        });
      }
    })
    .on('error', callback);
}

//==============================================================================
getPage.Title = function (address, callback) {
  return getPage(address, function (err, page) {
    err ? callback(err) : callback(null, page.getTitle());
  });
};

//==============================================================================
getPage.Images = function (address, callback) {
  return getPage(address, function (err, page) {
    err ? callback(err) : callback(null, page.getImages());
  });
};

//==============================================================================
getPage.Mp3s = function (address, callback) {
  return getPage(address, function (err, page) {
    err ? callback(err) : callback(null, page.getMp3s());
  });
};

//==============================================================================
getPage.Request = function (address, callback) {
  var urlObj = url.parse(address);
  var httpOrHttps = urlObj.protocol === 'http:' ? http : https;
  var options = {
    method: 'GET',
    host: urlObj.hostname,
    path: address /*urlObj.pathname,
    headers: {'Accept':'application/json'}*/,
  };
  //console.log(options);
  var data = '';
  httpOrHttps
    .request(options, function (res) {
      res.addListener('data', function (chunk) {
        data += chunk.toString();
      });
      res.addListener('end', function () {
        callback(null, data);
      });
    })
    .on('error', callback)
    .end();
};

//==============================================================================
getPage.ContentType = function (address, callback) {
  var urlObj = url.parse(address);
  var httpOrHttps = urlObj.protocol === 'http:' ? http : https;
  var options = { method: 'GET', host: urlObj.hostname, path: urlObj.pathname };
  var contentType;
  httpOrHttps
    .request(options, function (res) {
      var headers = res.headers;
      var location = headers.Location || headers.location;
      if (location) {
        options.path = location;
        httpOrHttps
          .request(options, arguments.callee)
          .on('error', callback)
          .end();
      } else {
        contentType =
          headers['content-type'] ||
          headers['Content-Type'] ||
          headers['Content-type'];
        callback(
          null,
          contentType && CONTENT_TYPE_REG.test(contentType)
            ? RegExp.$1
            : 'noContentType'
        );
      }
    })
    .on('error', callback)
    .end();
};

//==============================================================================
getPage.ContentEmbedWrapper = ContentEmbedWrapper;
module.exports = getPage;
