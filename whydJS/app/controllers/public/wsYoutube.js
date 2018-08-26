var http = require('http')
var mainTemplate = {renderWhydFrame: function (a) { return a } }

var maxResults = 20

var renderTemplate = function (results) {
  for (var i in results) { results[i] = {id: '/yt/' + results[i].id, name: results[i].title} }

  return results
}

exports.requestVideos = function (query, handler) {
  // console.log("querying youtube for: "+query);
  var host = 'gdata.youtube.com'
  var url = '/feeds/api/videos?v=2&alt=jsonc&first-index=0&max-results=' + maxResults + '&q=' + encodeURIComponent(query)
  // console.log("requesting: "+host+url+"...");
  var req = http.request({path: url, host: host, port: 80, method: 'GET'}, function (res) {
    var json = ''
    res.addListener('data', function (chunk) {
      json += chunk.toString()
    })
    res.addListener('end', function () {
      json = JSON.parse(json)
      var results = json.data.items || []
      console.log('wsYoutube: ' + query + ' => ' + (results ? results.length : 0) + ' videos')
      handler(results)
    })
  }).on('error', function (err) {
    console.log('[ERR] wsYoutube.requestVideos ', err)
    console.error('[ERR] wsYoutube.requestVideos ', err)
    handler([])
  }).end()
}

exports.render = function (q, callback) {
  exports.requestVideos(q, function (results) {
    callback(results ? renderTemplate(results) : 'Sorry, no videos were found about this topic...')
  })
}

exports.controller = function (request, reqParams, response) {
  exports.render(reqParams.q, function (html) {
    response.render(html, null, {'content-type': 'text/html'})
  })
}
