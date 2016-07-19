(function( $ ) {
  //Author : Thomas Eustache @eustachethomas
  //Version : 1.2
  $.fn.sliderz = function() {
    var timer;
    // OPTIONS
    switchTime = 3000; // in ms: Time before next , default : 3000 for 3sec
    fadeTime = 500; // in ms: Time for FadeFX , default : 500 for 0.5sec
    autoplay = false; // true:On, false:Off
    
    // DONT TOUCH AFTER HERE.
    thisSlider = this;
    slide = thisSlider.find('li');
    
    
    thisSlider.wrap('<div class="sliderz-me" />');
    thisSlider.after('<span class="prev">Previous</span><span class="next">Next</span>');
    slide.width($('.sliderz-me').width());
    thisSlider.addClass('sliderz-content');
    thisSlider.after('<ul class="sliderz-nav"/>');
    slideNav = thisSlider.parent().find('.sliderz-nav');
    
    slide.each(function( index ) {
      liContent = thisSlider.find('li').eq(index).html();
      slideNav.append('<li>'+ liContent +'</li>');
    });
    slideNavItem = slideNav.find('li');
    
    if(autoplay){
      timer = window.setInterval(nextSlide, switchTime);
    }
    currentSlide = 0;
    thisSlider.css({'width':slide.eq(currentSlide).width(), 'height':slide.eq(currentSlide).height()});
    slideNavItem.eq(currentSlide).addClass('active');
    
    function nextSlide(e){
      parentSlider = e.parent();
      currentSlide = parentSlider.find('.sliderz-nav li.active').index()+1;
      if(currentSlide>parentSlider.find('.sliderz-content li').length-1){
        currentSlide=0;
      }
      parentSlider.find('.sliderz-nav li').removeClass('active');
      parentSlider.find('.sliderz-content li').fadeOut(fadeTime);
      parentSlider.find('.sliderz-content').animate({'width':parentSlider.find('.sliderz-content li').eq(currentSlide).width(), 'height':parentSlider.find('.sliderz-content li').eq(currentSlide).height()},300);
      parentSlider.find('.sliderz-content li').eq(currentSlide).fadeIn(fadeTime);
      parentSlider.find('.sliderz-nav li').eq(currentSlide).addClass('active');
    }
    function prevSlide(e){
      parentSlider = e.parent();
      currentSlide = parentSlider.find('.sliderz-nav li.active').index()-1;
      if(currentSlide<=-1){
        currentSlide=parentSlider.find('.sliderz-content li').length-1;
      }
      parentSlider.find('.sliderz-nav li').removeClass('active');
      parentSlider.find('.sliderz-content li').fadeOut(fadeTime);
      parentSlider.find('.sliderz-content').animate({'width':parentSlider.find('.sliderz-content li').eq(currentSlide).width(), 'height':parentSlider.find('.sliderz-content li').eq(currentSlide).height()},300);
      parentSlider.find('.sliderz-content li').eq(currentSlide).fadeIn(fadeTime);
      parentSlider.find('.sliderz-nav li').eq(currentSlide).addClass('active');
    }
    
    
    slideNavItem.click(function(){
      if(!$(this).hasClass('active')){
        index  = $(this).index();
        $(this).closest('.sliderz-me').find('.sliderz-nav li').removeClass('active');
        $(this).closest('.sliderz-me').find('.sliderz-content li').fadeOut(fadeTime);
        $(this).closest('.sliderz-me').find('.sliderz-content li').eq(index).fadeIn(fadeTime);
        $(this).addClass('active');
        currentSlide = index;
        if(autoplay){
          window.clearInterval(timer);
          timer = window.setInterval(nextSlide,switchTime);
        }
      }
    });
    
    thisSlider.parent().find('.prev').click(function(event){
      prevSlide($(this));
      if(autoplay){
        window.clearInterval(timer);
        timer = window.setInterval(nextSlide,switchTime);
      }
    });
    thisSlider.parent().find('.next').click(function(event){
      nextSlide($(this));
      if(autoplay){
        window.clearInterval(timer);
        timer = window.setInterval(nextSlide,switchTime);
      }
    });
    

  };
})( jQuery );