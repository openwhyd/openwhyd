
/* === bookmarklet ad == */

(function initBookmarkletAd() {
	$("#bookmarkletAd .postRemove").click(function() {
		$.ajax({
			type: "POST",
			url: "/api/user",
			data: {pref: {hideBkAd:1}},
			success: function(res){
				$("#bookmarkletAd").animate({height:0}, function() {$(this).remove()});
			},
			error: function(e) {
				showMessage(e);
			}
		});
	});
})();

/* === invite ad == */

(function initInviteAd() {

	function getFriends(cb) {
		var data = {
			ajax: "fbfriends",
			fetchUsersToInvite: true
		};
		$.ajax({
			type: "POST",
			url: "/api/fbfriends",
			data: data,
			success: cb
		});
	}

	function sendFbInvite(fbId, inviteCode, cb) {
		fbSendMessage({
			to: fbId,
			link: '/invite/' + inviteCode
		}, cb);
	}

	function requestInviteCode(fbId, name, cb) {
		$.ajax({
			type: "POST",
			url: "/invite",
			data: {fbId: fbId},
			success: function(res) {
				console.log("invite code", typeof res, res);
				cb((res || {}).inviteCode);
			},
			error: function(e) {
				cb();
			}
		});
	}

	function deleteInviteCode(inviteCode) {
		$.ajax({
			type: "DELETE",
			url: "/invite/" + inviteCode,
			success: function(res) {
				console.log("deleted invite code", res);
			},
			error: function(e) {
				console.log("error while trying to deleted invite code", e);
			}
		});
	}

	function onInviteClick() {
		var $btn = $(this);
		var $li = $btn.parent();
		var fbId = $btn.attr("data-fbid");
		var name = $li.find("a").first().text();

		if (!$btn.hasClass("invited"))
			requestInviteCode(fbId, name, function(inviteCode) {
				if (inviteCode)
					sendFbInvite(fbId, inviteCode, function(sent) {
						if (sent) {
							$btn.addClass("invited");
							$btn.text("Invited");
							showMessage("Your invitation is on its way to " + name + "! Thank you!");
							setTimeout(function() {
								$li.animate({opacity:"0"}, function() {
									$li.replaceWith(renderNextFriends(1).find("li"));
								});
							}, 3000);
						}
						else
							/*showMessage("Failed to send the invite to Facebook... Please try again later!");*/
							deleteInviteCode(inviteCode);
  					});
				else
					showMessage("Failed to generate an invite code... Please try again later!");
			});
	}

	function createInviteButton(user, $li){
		var $btn = $(document.createElement('span'));
		$btn.text("Invite");
		$btn.addClass("userSubscribe");
		$btn.attr("data-fbid", user.fbId);
		$btn.click(onInviteClick);
		$btn.appendTo($li);
	}

	function renderNextFriends(nb) {
		var selection = [];
		for (var i=nb; i>0; --i) {
			selection.push(fbfriends[nextIndex]);
			nextIndex = (nextIndex + 1) % fbfriends.length;
		}
		return _renderUserList(selection, createInviteButton);
	}

	var fbfriends = [], nextIndex;

	$(document).ready(function(){
		var $box = $(".inviteAd");
		getFriends(function(json) {
			if (json && !json.error && json.fbfriends && json.fbfriends.length) {
				fbfriends = json.fbfriends;
				nextIndex = Math.floor(Math.random() * fbfriends.length);
				$box.empty().append(renderNextFriends(2));
				//displayNextFriends();
				//setInterval(displayNextFriends, 1000);
			}
			//else
			//	console.log("getFriends", json);
		});
	});

})();

/* === invite by email === */

(function initEmailInvite() {
	var $inviteEmail = $(".inviteAd .fld");
	var $inviteSubmit = $(".inviteAd input[type=submit]");
	var emailCheck = /^[\w\.\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,4}$/i;

	$inviteEmail.find("input")
		.bind("click keydown", function /*backtonormal*/() {
			$(this).parent().removeClass("error").removeClass("valid");
		})
		.blur(function /*validateEmail*/() {
			var val = $(this).val();
			if (val == "") return 0;
			var valid = emailCheck.test(val);
			$inviteEmail.addClass(valid ? "valid" : "error");
			return valid ? 1 : -10;
		});
		/*click(backtonormal).keydown(backtonormal);*/

	var $form = $(".inviteAd").submit( function(event) {
		event.preventDefault();
		$form.addClass("sending");
		$.ajax({
			type: "POST",
			url: "/invite",
			data: $form.serialize(),
			success: function(res) {
				console.log("res", res);
				var sent = res && res.ok && res.email;
				if (sent)
					$(".valid").addClass("sent");
				$form.removeClass("sending");
				showMessage(sent ? "Invitation is on its way to " + res.email + "! Thank you!"
					: "Invitation was not send. Please check that the email address is valid", !sent);
			},
			error: function() {
				$form.removeClass("sending");
			}
		});
	});

	$(document).ready(function() {
		$inviteEmail.placeholder();
	});
})();

/* === suggested users === */

function clearSuggestedUser(elt) {
	$(elt).css({overflow:"hidden"}).animate({height:"0px", opacity:"0"}, function() {
		$(this).remove();
	});
}
var subscribeTimer = null;
function subscribeToUserAndClear(elt) {
	var $li = $(elt);/*.closest("li[data-uid]");*/
	var $link = $li.find(".subscribe");
	if ($link.html() == "Follow") {
		$link.html("Unfollow");
		subscribeTimer = setTimeout(function() {
			subscribeTimer = null;
			subscribeToUser($li.attr("data-uid"), function() {
				clearSuggestedUser(elt);
			});
		}, 2000);
	}
	else {
		$link.html("Follow");
		if (subscribeTimer) {
			clearTimeout(subscribeTimer);
			subscribeTimer = null;
		}
	}
}

/* === city page ad == */

(function initIphoneAppAd() {
	var COOKIE_DEF = "whydIosAppAd=0", COOKIE_EXP = 365*24*60*60*1000; // 1 year
	// display date: Mon Jun 23 2014 16:10:29 GMT+0200 (CEST)
	var display = Date.now() > 1403532629547 && (document.cookie || "").indexOf(COOKIE_DEF) == -1;
	if (display) {
		var $box = $("#iphoneAppAd").show();
		$box.find(".postRemove").click(function() {
			document.cookie = COOKIE_DEF + "; expires=" + new Date(Date.now() + COOKIE_EXP).toGMTString();
			$box.animate({height:0}, function() {$(this).remove()});
		});
	}
})();
