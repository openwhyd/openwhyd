/* global $ */

window.initMenuScrollAnimation = function (menuId, options) {
  options || (options = {});

  const scrollTime = options.scrollTime || 1000;
  const menuActiveClass = options.menuActiveClass || 'active';
  const anchors = $('#' + menuId + ' a');
  const sections = [];

  anchors.each(function (i) {
    sections.push($($(anchors[i]).attr('href')));
  });

  anchors.click(function () {
    const anchor = $(this);
    $('#' + menuId + ' a.' + menuActiveClass).removeClass(menuActiveClass);
    anchor.addClass(menuActiveClass);
    $('html, body').animate(
      {
        scrollTop: $(anchor.attr('href')).offset().top,
      },
      scrollTime,
    );
  });

  $(window).scroll(function () {
    const scrollTop = $(this).scrollTop();
    let i, section;
    for (i = sections.length - 1; i >= 0; i--) {
      section = sections[i];
      if (scrollTop >= section.offset().top) {
        $('#' + menuId + ' a.' + menuActiveClass).removeClass(menuActiveClass);
        $('#' + menuId + ' a[href="#' + section.attr('id') + '"]').addClass(
          menuActiveClass,
        );
        return;
      }
    }
  });
};
