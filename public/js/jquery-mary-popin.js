/*
 * jQuery Mary Popin
 *
 * Author : @starfennec
 * Version: 0.3 alpha
 * Date: June 5 2013
 */

(function($) {
	var methods = undefined;
	
	methods = {
		init : function(popin, options){
			popin = $(popin);
			
			var settings = $.extend( {
				position: 'middle',
				close: '.close',
				speed: 300,
				maskClick: true,
				beforeOpen: undefined,
				afterOpen: undefined,
				beforeClose: undefined,
				afterClose: undefined
			}, options);
			
			settings.popin = popin;
			settings.htmlVal = 'auto';
			settings.bodyVal = 'auto';
			
			this.data('settings', settings);
			
			// Move popin in the mask
			popin.hide().appendTo(methods.mask);
			
			// Close button event
			popin.find(settings.close).click((function(self){ return function(e){
				e.preventDefault();
				methods.close.apply(self);
			}; })(this));
						
			popin.click(function(e){
				e.stopPropagation();
			});
			
			// Trigger click
			this.click((function(self){ return function(e){
				e.stopPropagation();
				e.preventDefault();
				methods.open.apply(self);
			}; })(this));
		},
		open: function() {
			if(methods.openedPopin){
				methods.closePopin.call(this, (function(self){ return function(){	
					methods.openPopin.apply(self);
				}; })(this));
			} else {
				methods.openMask.apply(this);
				methods.openPopin.apply(this);
			}
		},
		openMask: function(){
			// Store html & body tags overflow values
			var settings = this.data('settings');
			settings.htmlVal = $('html').css('overflow');
			settings.bodyVal = $('body').css('overflow');
			
			$('html, body').css({'overflow' : 'hidden'});
			
			// Show mask (set timeout to fix IE display bug)
			setTimeout(function(){
				methods.mask.fadeIn(300);
			},0);
		},
		openPopin: function(){
			var settings = this.data('settings');
			
			methods.openedPopin = this;
			
			// 'Before' function
			if(typeof settings.beforeOpen === 'function')
				settings.beforeOpen.call(this);
			
			// Set popin position
			positionPopin.apply(this);
			
			// Show popin
			settings.popin.addClass('animate-on').fadeIn(settings.speed, function(){				
				if(typeof settings.afterOpen === 'function')
					settings.afterOpen.call(this);
				$(this).removeClass('animate-on');
			});
		},
		close: function() {
			if(methods.openedPopin){
				methods.closeMask.apply(this);
				methods.closePopin.apply(this);
			}
		},
		closePopin: function(callback){
			var settings = methods.openedPopin.data('settings');
			
			// 'Before' function
			if(typeof settings.beforeClose === 'function')
				settings.beforeClose.call(methods.openedPopin);
			
			window.popinObject = settings.popin;
			
			settings.popin.addClass('animate-off').fadeOut(settings.speed, function(){
				if(typeof settings.afterClose === 'function')
					settings.afterClose.call(methods.openedPopin);
				methods.openedPopin = undefined;
				
				if(typeof callback === 'function')
					callback();
				$(this).removeClass('animate-off');
			});
		},
		closeMask: function(){
			var settings = this.data('settings');
			
			// Hide mask (set timeout to fix IE display bug)
			setTimeout(function(){
				methods.mask.fadeOut(300, function(){
					// Restore html & body tags initial overflow value
					$('html').css({'overflow' : settings.htmlVal});
					$('body').css({'overflow' : settings.bodyVal});
				});
			},0);
		}
	};
	
	function positionPopin(){
		var margin = undefined;
		
		var settings = this.data('settings');
		
		// set timeout for right popin height
		setTimeout(function(){
			switch(settings.position){
				case "middle" :
					margin = Math.floor((methods.windowHeight - settings.popin.outerHeight()) / 2);
					if(margin < 0)
						margin = 0;
					break;
				case "top" :
					margin = 0;
					break;
			}
		
			settings.popin.css({
				'position' : 'relative',
				'margin-top' : margin + 'px'
			});
		}, 0);
	}
	
	// Custom console.log
	function log() {
	if (window.console && console.log)
		console.log('[MaryPopin] ' + Array.prototype.join.call(arguments,' '));
	}
	
	// Get viewport height
	function getViewportHeight(){
		if (typeof window.innerHeight != 'undefined')
		    methods.windowHeight = window.innerHeight;
		else if (typeof document.documentElement != 'undefined'
		&& typeof document.documentElement.clientHeight !=
		'undefined' && document.documentElement.clientHeight != 0)
		    methods.windowHeight = document.documentElement.clientHeight;
		else
			methods.windowHeight = $(window).height();
	}
	
	function globalInit() {
		// Create mask
		$('<div id="popin-mask"></div>')
			.appendTo('body')
			.css({
				'bottom' : 0,
				'display' : 'none',
				'left' : 0,
				'position' : 'fixed',
				'right' : 0,
				'top' : 0,
				'z-index' : 99999,
				'overflow-y' : 'scroll',
				'-webkit-overflow-scrolling' : 'touch'
			});
		methods.mask = $('#popin-mask');
		
		// Mask click event
		methods.mask.click(function(){
			if(methods.openedPopin != undefined){
				var settings = methods.openedPopin.data('settings');
				
				if(settings.maskClick === true)
					methods.close.apply(methods.openedPopin);
			} else {
				log('No popin initialized');
			}
		});
		
		// Close popin on escape key press 
		document.onkeydown = function(evt) {
			evt = evt || window.event;
			
			if (evt.keyCode == 27)
				methods.close.apply(methods.openedPopin);
		};
		
		// Get viewport height
		getViewportHeight();
		
		$(window).resize(function(){
			getViewportHeight();
		});
		
		// Reload popin position on viewport size change
		$(window).resize(function(){
			if(methods.openedPopin)
				positionPopin.apply(methods.openedPopin);
		});
	}
	
	globalInit();
	
	$.fn.marypopin = function( method, options ) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ((typeof method === 'string') || (typeof method === 'object')) {
			return methods.init.apply( this, arguments );
		} else if ((! method) || (typeof method === 'int')) {
			log('No popin element');
		} else {
			log('No method "' +  method + '"');
		}
	};

})(jQuery);