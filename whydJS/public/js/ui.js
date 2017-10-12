/**
 * general ui functions
 * @author adrienjoly
 **/

// prevents bug in firefox 3
if (undefined == window.console)
	console = {log:function(){}};

// === Popup dialogs / video overlays ===

function openHtmlDialog(html) {
	// Open Avgrund modal
	$(document).avgrund({
		openOnEvent: false,
		width: 560,
		height: 315,
		responsive: true,
		//holderClass: 'custom',
		showClose: true,
		showCloseText: 'close',
		//onBlurContainer: '#contentPane',
		enableStackAnimation: true,
		template: html,
		onLoad: function(){
			console.log('Avgrund loaded!');
		},
		onReady: function(){
			console.log('Avgrund ready!');
			overflowPopin();
		},
		onUnload: function(){
			console.log('Avgrund closed!');
			console.log("closing dialog, handler:", !!window.onDialogClose);
			window.onDialogClose && window.onDialogClose();
		}
	});
}

function overflowPopin() {
	var avgrund = $('.avgrund-popin');
	var child = $('.avgrund-popin').children().eq(1);

	if(child.innerHeight() > avgrund.height()) {
		avgrund.css('overflow-y', 'scroll');
		avgrund.css('overflow-x', 'hidden');
	}
	else {
		avgrund.css('overflow', 'hidden');
	}
}

function openJqueryDialog($element, dlgClass, title) {
	var dlg = $("<div>").attr("class", "dlg " + (dlgClass||'')).append($element);
	if (title)
		dlg.prepend("<h1>" + title + "</h1>");
	openHtmlDialog(dlg);
}

function openRemoteDialog(url, dlgClass, callback) {
	openJqueryDialog("", (dlgClass||"") + " loading")

	$.ajax({
		type: "GET", url: url,
		complete: function(data) {
			var $ajaxFrame = $(".dlg");
			$ajaxFrame.html(data.responseText)
				.ready(function() {
					//$(this).find("a").click(function(){$.modal.close();});
					$ajaxFrame.removeClass("loading");
					if(callback)
						callback($ajaxFrame);
				});
		}
	});
}

function showMessage(txt, isError) {
	if (txt && typeof txt == "object") {
		isError = isError || txt.error;
		txt = txt.error || txt.message || txt.result || txt;
	}
	$("#whydMessageContainer").remove();
	var $container = $('<div id="whydMessageContainer" class="'+(isError?'error':'')+'"><div>'+txt+'</div></div>');
  $container.css('zIndex', 1002);
	$("body").append($container);
	function disappear(){
		$container.animate({"height": "0px"}, 300/*, function(){ $(this).hide(); }*/); //.fadeOut();
	}
	$container.click(disappear)./*css("max-height", 0).show().*/animate({"height": "38px"}, 400);
	setTimeout(disappear, 4000);
	try { if ($.fn.ajaxify) $("body").ajaxify(); } catch(e) { console.log(e, e.stack); }
}

// for WhydCanvas app, when embedded in a Facebook page tab
function adaptToWindowSize(){
	$("body").toggleClass("fbIframe", $(window).width() < 820);
};

// LOGGING FUNCTIONS

function WhydLogging() {

	var emailCheck = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
	//var pwdRegex = /^[a-zA-Z0-9!@#$%^&*]{4,32}$/;

	this.validateField = {
		"name": function($name) {
			if (!$name.val()/*.trim()*/)
				return /*! $name.each(error(*/"Please enter your name. E.g. John Smith"/*))*/;
			else
				return null; //$name.each(ok);
		},
		"email": function($email) {
			if (!emailCheck.test($email.val()/*.trim()*/)) // trim not supported by IE8-
				return /*! $name.each(error(*/"Your email address looks wrong..."/*))*/;
			else
				return null; //$name.each(ok);
		},
		"password": function($password) {
			var pwd = $password.val()/*.trim()*/;
			if (pwd.length < 4 || pwd.length > 32)
				return /*! $password.each(error(*/"Please enter a password between 4 and 32 characters"/*))*/;
			//else if (!pwdRegex.test(pwd))
			//	return /*! $password.each(error(*/"Your password contains invalid characters"/*))*/;
			else
				return null; //$password.each(ok);
		}
	};

	this.validateFields = function(fieldSetList) { // [{name:$name},{password:$password}...] // old name: signIn()
		var results = [];
		for(var i in fieldSetList)
			for(var key in fieldSetList[i]) {
				var $elt = fieldSetList[i][key];
				var error = this.validateField[key]($elt);
				if (error) {
					var errorObj = {};
					errorObj[key] = error;
					results.push(errorObj);
				}
				$elt.toggleClass("ok", !error).toggleClass("error", error);
			}
		/*
		var err = this.validateName($name);
		if (err) return err;
		err = this.validateEmail($email);
		if (err) return err;
		err = this.validatePassword($validatePassword);
		if (err) return err;
		*/
		return results; // => [{name:"error 1"},{password:"error 2"}...]
	}

	return this;
}

$(window).resize(adaptToWindowSize);
$(adaptToWindowSize);
