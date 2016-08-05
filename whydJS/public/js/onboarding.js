function ajaxQuery(data, cb) {
	var $body = $("body").addClass("loading");
	$.ajax({
		type: "POST",
		url: "/onboarding",
		data: data,
		dataType: "json",
		success: function(data){
			$body.removeClass("loading");
			cb && cb(data);
		},
		error: function(error) {
			$body.removeClass("loading");
			showMessage(json.error);
			if (!cb || !cb({error: error}))
				throw error;
		}
	});
}

function disableLink() {
	$(this).css("cursor", "default")
		.attr("href","javascript:return false;")
		.unbind().click(function(e) { e.preventDefault(); });
}

$(".homeLink").each(disableLink);

// step: genres

function initOnbGenres() {
	try {
		window.Whyd.tracking.log("Visit genre selection page");
	} catch (e) {
		console.log("mixpanel", e, e.stack);
	}
	$("#genreGallery li").each(function(){
		$(this).append("<div>").click(function(){
			$(this).toggleClass("selected");
			$("#btnNext").toggle(!!$("#genreGallery li.selected").length);
		});
	});
	$("#btnNext").click(function(e){
		e.preventDefault();
		var tags = $("#genreGallery li.selected").map(function(){
			return $(this).find("p").text();
		}).get();
		$("input[name=genres]").val(tags.join(",")).parent().submit();
		return false;
	});
}

// step: people

function initOnbPeople(genres) {
	var $userList = $(".userList");

	function renderUserInList (user) {
		var tags = (user.tags || []).map(function(tag){
			//return $("<a class='tag'>").attr("href", tag.url).text(tag.id + " (" + tag.c + ")");
			return $('<li class="tag" class="user">').text(tag.id);
		});
		if (tags.length)
			tags = tags.reduce(function($tags, $nextTag){
				return $tags.add('<span>&bull;&nbsp;</span>').add($nextTag);
			});
		var $li = $('<li>') .attr({
			"data-id": user.id,
			"data-subscribed": user.subscribed,
			"class": "user" + (user.cssClasses || "") })
			.append($("<div class='thumb'>")
				.css("background-image", "url('/img/u/"+user.id+"?width=100&amp;height=100')")
				.append($('<div>')))
			.append($("<p class='username'>").text(user.name));
			



		$li.append($("<p class='userbio'>").text(user.bio));
		$li.append($("<ul class='tags'>").append(tags));

		//_createSubscribeButton(user, $li);
		if (!window.user || window.user.id != user.id)
			$li.append($("<span class='userSubscribe'>")
				.attr("data-uid", user.id)
				.text(user.subscribed ? 'Following' : 'Follow')
				.toggleClass("subscribed", user.subscribed ? true : false)
				.click(function(){
					var subscribed = !$(this).hasClass("subscribed");
					$(this).toggleClass("subscribed", subscribed).text(subscribed ? "Following" : "Follow");
				})
				.mouseenter(function(){if ($(this).hasClass("subscribed")) this.innerHTML = "Unfollow"})
				.mouseleave(function(){if ($(this).hasClass("subscribed")) this.innerHTML = "Following"}));
		return $li;
	};

	/*function fetchFacebookFriends(cb) {
		ajaxQuery({ ajax: "fbFriends", genres: genres }, function(fbFriends) {
			//console.log("fbFriends", fbFriends);
			if (fbFriends && fbFriends.length) {
				for (var i in fbFriends) {
					fbFriends[i].subscribed = true;
					fbFriends[i].cssClasses = (fbFriends[i].cssClasses || "") + " fbFriend";
					$userList.append(renderUserInList(fbFriends[i]));
				}
			}
		});
	}*/
	function fetchRecomUsers(cb) {
		ajaxQuery({ ajax: "people", genres: genres }, function(recomUsers) {
			//console.log("recomUsers", recomUsers);
			if (recomUsers && recomUsers.length) {
				$("h1").text("You're now subscribing to music lovers we think you'll like");
				for (var i in recomUsers) {
					recomUsers[i].subscribed = true;
					$userList.append(renderUserInList(recomUsers[i]));
				}
				$("#recomUsers").show();
			}
			cb();
		});
	}
	//$(".userList a, .userList div[style], .homeLink").each();
	fetchRecomUsers(function(){
		$("#btnNext").show();
		//fetchFacebookFriends();
	});
	$("#btnNext").click(function(e){
		e.preventDefault();
		var uids = $(".userList .subscribed").toArray().map(function(elt){
			return $(elt).closest("[data-id]").attr("data-id");
		});
		console.log("uids", uids.length, uids);
		ajaxQuery({ ajax: "follow", uids: uids.join(',') }, function() {
			//goToPage("/welcome");
			//goToPage("/pick/button");
			window.location.href = "/pick/button";
		});
		//$("input[name=genres]").val(tags.join(",")).parent().submit();
		return false;
	});
}

// step: button

function initOnbButton() {

	function toggleMode(e) {
		e && e.preventDefault();
		$(".modeBk, .modeExt").toggle();
		return false;
	}

	function moveTo(id, scrollTime) {
		$('html, body').animate({
			scrollTop: $(id).offset().top
		}, scrollTime);
	}

	$('.step1').click(function(){
		$(this).fadeOut(300,function(){
			$('.howToUseButtonNormal').height(542);
			$('.indication1').fadeIn(300,function(){
				$('.indication2').fadeIn(300);
			});
		});
		return false;
	});

	$('#linkToInstall').click(function() {
		moveTo("#installTest", 1000);
	});

	$(".toggleMode").click(toggleMode);

	// NB: this only works when run from openwhyd.org (verified domain for the chrome extension)
	if ($.browser.chrome && parseInt((""+$.browser.version).split(".")[0]) >= 15) {
		$("#btnInstallChromeExt").click(function(e){
			console.log("trying to install chrome extension", e.target.href);
			chrome.webstore.install(e.target.href, function(){}, function() {
				console.log("failed => opening chrome web store in a new tab...");
				//goToPage(e.href);
				window.open(e.target.href, '_blank').focus();
			});
			return false;
		});
		//toggleMode();
		$(".modeExt").show();
	}
	else
		$(".modeBk").show();


	// adapt instructions to web browser in use
	$("li.instr").hide();
	var b = ["Opera", "MSIE 8.", "MSIE", "Chrome", "Safari", "Firefox"];
	for (var i in b)
		if (navigator.userAgent.indexOf(b[i]) != -1) {
			$(".instr." + b[i].toLowerCase().replace(/[^a-z0-9]+/g, "")).show();
			$(".browserIcon").attr("class", "browserIcon " + b[i].toLowerCase());
			break;
		}

	$(".video > a").click(function(e){
		e.preventDefault();
		openHtmlDialog('<iframe src="'+$(this).attr("href")+'" width="560" height="315" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>');
		return false;
	})
}
