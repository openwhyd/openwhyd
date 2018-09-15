/**
 *  jQuery Avgrund Popin Plugin
 *  http://github.com/voronianski/jquery.avgrund.js/
 *
 *  (c) 2012-2013 http://pixelhunter.me/
 *  MIT licensed
 */

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		module.exports = factory;
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {
	$.fn.avgrund = function (options) {
		var defaults = {
			width: 380, // max = 640
			height: 280, // max = 350
			responsive: false, // if popin size depends on content
			showClose: false,
			showCloseText: '',
			closeByEscape: true,
			closeByDocument: true,
			holderClass: '',
			overlayClass: '',
			enableStackAnimation: false,
			onBlurContainer: '',
			openOnEvent: true,
			setEvent: 'click',
			onLoad: false,
			onReady: false,
			onUnload: false,
			template: '<p>This is test popin content!</p>'
		};

		options = $.extend(defaults, options);

		return this.each(function() {
			var self = $(this),
				body = $('body'),
				maxWidth = options.width > 640 ? 640 : options.width,
				maxHeight = options.height > 350 ? 350 : options.height,
				template = typeof options.template === 'function' ? options.template(self) : options.template;

			body.addClass('avgrund-ready');

			if ($('.avgrund-overlay').length === 0) {
				body.append('<div class="avgrund-overlay ' + options.overlayClass + '"></div>');
			}

			if (options.onBlurContainer !== '') {
				$(options.onBlurContainer).addClass('avgrund-blur');
			}

			function onDocumentKeyup (e) {
				if (options.closeByEscape) {
					if (e.keyCode === 27) {
						deactivate();
					}
				}
			}

			function onDocumentClick (e) {
				if (options.closeByDocument) {
					if ($(e.target).is('.avgrund-overlay, .avgrund-close')) {
						e.preventDefault();
						deactivate();
					}
				} else if ($(e.target).is('.avgrund-close')) {
						e.preventDefault();
						deactivate();
				}
			}

			function activate () {
				if (typeof options.onLoad === 'function') {
					options.onLoad(self);
				}

				setTimeout(function() {
					body.addClass('avgrund-active');
				}, 100);

				var $popin = $('<div class="avgrund-popin ' + options.holderClass + '"></div>');
				if (options.showClose) {
					$popin.append('<div class="close"><a href="#" class="avgrund-close">' + options.showCloseText + '</a></div>');
				}
				$popin.append(template);
				body.append($popin);

				if(options.responsive) {
					avgrundAdaptSize();
				}
				else {
					// Fix for window scroll
					var s = $('body').scrollTop();

					$('.avgrund-popin').css({
						'width': maxWidth + 'px',
						'height': maxHeight + 'px',
						'margin-left': '-' + (maxWidth / 2 + 10) + 'px',
						'margin-top': '-' + (maxHeight / 2 + 10 - s) + 'px'
					});
				}

				if (options.enableStackAnimation) {
					$('.avgrund-popin').addClass('stack');
				}

				body.bind('keyup', onDocumentKeyup)
					.bind('click', onDocumentClick);

				$popin.bind('click', avgrundAdaptSize);

				if (typeof options.onReady === 'function') {
					options.onReady(self);
				}
			}

			function deactivate () {
				body.unbind('keyup', onDocumentKeyup)
					.unbind('click', onDocumentClick)
					.removeClass('avgrund-active');

				setTimeout(function() {
					$('.avgrund-popin').remove();
				}, 500);

				if (typeof options.onUnload === 'function') {
					options.onUnload(self);
				}
			}

			if (options.openOnEvent) {
				self.bind(options.setEvent, function (e) {
					e.stopPropagation();

					if ($(e.target).is('a')) {
						e.preventDefault();
					}

					activate();
				});
			} else {
				activate();
			}
		});
	};
}));

function avgrundClose() {
	console.log("closing avgrund modal dialog");
	$('.avgrund-overlay').trigger('click');
}

$.modal = { close: avgrundClose };

function avgrundAdaptSize() {

	var maxWidth = 640;
	var maxHeight = $(window).height()-100;

	var $popin = $('.avgrund-popin');
	// Get the content of the popin
	var child = $popin.children().eq(1);

	// Set popin's height accordingly
	var h = child.innerHeight();
	if(h < maxHeight) {
		maxHeight = h;
	}

	// Set popins width accordingly
	var w = child.innerWidth();
	//console.log(w);
	if(w != maxWidth) {
		maxWidth = w;
	}

	// Fix for window scroll
	var s = $(document).scrollTop();
	var margintop = maxHeight / 2;
	var margincss = "0px";
	if(margintop > s) {
		margintop -= s;
		margincss = '-' + margintop + 'px';
	}
	else {
		margincss = (s - margintop) + 'px';
	}

	$('.avgrund-popin').css({
		'width': maxWidth + 'px',
		'height': maxHeight + 'px',
		'margin-left': '-' + (maxWidth / 2) + 'px',
		'margin-top': margincss
	});
}
