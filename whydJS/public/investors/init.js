//= =============================================================================
function initMenuScrollAnimation (menuId, options) {
  options || (options = {})

  var scrollTime = options.scrollTime || 1000
  var menuActiveClass = options.menuActiveClass || 'active'
  var anchors = $('#' + menuId + ' a')
  var sections = []

  anchors.each(function (i) {
    sections.push($($(anchors[i]).attr('href')))
  })

  anchors.click(function () {
    var anchor = $(this)
    $('#' + menuId + ' a.' + menuActiveClass).removeClass(menuActiveClass)
    anchor.addClass(menuActiveClass)
    $('html, body').animate({
      scrollTop: $(anchor.attr('href')).offset().top
    }, scrollTime)
  })

  $(window).scroll(function () {
    var scrollTop = $(this).scrollTop()
    var i, section
    for (i = sections.length - 1; i >= 0; i--) {
      section = sections[i]
      if (scrollTop >= section.offset().top) {
        $('#' + menuId + ' a.' + menuActiveClass).removeClass(menuActiveClass)
        $('#' + menuId + ' a[href="#' + section.attr('id') + '"]').addClass(menuActiveClass)
        return
      }
    }
  })
}
