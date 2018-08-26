$(function () {
  function removeAccents (str) {
    return !str ? '' : str
      .replace(/[àâä]/gi, 'a')
      .replace(/[éèêë]/gi, 'e')
      .replace(/[îï]/gi, 'i')
      .replace(/[ôö]/gi, 'o')
      .replace(/[ùûü]/gi, 'u')
  }

  var $uId = $('form input[name=uId]')
  var $thumb = $('form .thumb')
  function updateThumb () {
    $thumb.css('background-image', "url('/img/u/" + $uId.val() + "')")
  }
  $uId.bind('keyup input onpaste', updateThumb)
  updateThumb()

  var $title = $('form input[name=title]')
  var $url = $('#contestUrl')
  var defaultUrl = $url.text()
  function updateUrl (url) {
    var newUrl = defaultUrl.split('/')
    newUrl[2] = removeAccents((typeof url === 'string' ? url : $title.val()).toLowerCase()).replace(/\s/g, '_')
    $url.text(newUrl.join('/'))
  }
  $title.bind('keyup input onpaste', updateUrl)
  updateUrl($title.attr('placeholder'))
})
