function htmlDecode(s) {
	return $('<div />').html(s).text();
}

var sections = {
	"featured": function($content) {
		var $ul = $content.find("ul");
		var $img = $content.find("input[name=img]");
		var $thumb = $content.find(".thumb");
		function updateThumb() {
			$thumb.css("background-image", "url('"+$img.val()+"')");
		}
		$img.bind("keyup input onpaste", updateThumb);
		$("#addFeatured").submit(function(e){
			e.preventDefault();
			$.post($(this).attr("action"), $(this).serialize(), function(json){
				console.log("response", json);
				goToPage();
			});
		});
		var $url = $("input[name=url]").bind("keyup input onpaste", function() {
			$.get("/discover", { ajax: "parseBlogPost", url: $url.val() }, function(json) {
				//console.log("parseBlogPost response", json)
				for (var f in json) {
					json[f] = htmlDecode(json[f]);
					console.log(f, json[f]);
					$("input[name="+f+"]").val(json[f]);
				}
				if (json.img)
					updateThumb();
			});
		});
		function renderPost(p) {
			var $li = _renderUserInList({
				url: "/u/"+p.uId, //p.url,
				img: p.img,
				id: p.uId,
				name: p.uNm,
				subscribed: p.subscribed,
				thumbClickHandler: function(){
					$(this).closest("li").find("a.blogLink")[0].click();
				}
			});
			$li.find("small").text(p.desc)
				.append('<br><br><a target="_blank" href="'+p.url+'" class="blogLink">Read '+p.uNm+'\'s full interview</a>');
			if (p.date)
				$('<div>').text(p.date).appendTo($li.find(".thumb"));
			return $li;
		};
		$.get("/discover", { ajax: "featured" }, function(json) {
			$(".loading").removeClass("loading");
			console.log("featured", json)
			if (json && !json.error && json.posts) {
				var $out = $("ul");
				for (var i=0; i<json.posts.length; ++i)
					$out.append(renderPost(json.posts[i]));
				if ($out.ajaxify)
					$out.ajaxify();
			}
			else
				(json || {}).error ? showMessage(json.error) : console.log("rankings error", json);
		});
	},
	"ranking": function($content) {
		function renderUserRanking(users) {
			var $out = $("<ul>").addClass("userList");
			for (var i=0; i<users.length; ++i) {
				var $li = _renderUserInList(users[i]);
				var $box = $('<div class="statBox">')
					.append($('<div class="nbSubscribers">').text(users[i].nbSubscribers))
					.append($('<div class="nbAdds">').text(users[i].nbAdds))
					.append($('<div class="nbLikes">').text(users[i].nbLikes))
					.append($('<div class="nbPlays">').text(users[i].nbPlays))
				$out.append($li.prepend($box));
			}
			return $out.ajaxify ? $out.ajaxify() : $out;
		};
		$.get("/discover", { ajax: "ranking" }, function(json) {
			$(".loading").removeClass("loading");
			console.log("ranking", json)
			if (json && !json.error) {
				var $li = $content.html(renderUserRanking(json))
					.prepend("<p>The World Whyd Ranking reflects the most influential people sharing music on Whyd this week</p>")
					.find("li");
				$li.eq(0).append("<div class='rankMedal rank1'>1</div>");
				$li.eq(1).append("<div class='rankMedal rank2'>2</div>");
				$li.eq(2).append("<div class='rankMedal rank3'>3</div>");
			}
			else
				(json || {}).error ? showMessage(json.error) : console.log("rankings error", json);
		});
	},
	"users": function($content) {
		var $subtitle = $content.find("#subtitle").show();
		var scoreClasses = [
			[80, "Holy shit!!!"],
			[50, "Great match!"],
			[20, "Not too bad!"],
			[10, "Well, it's a good start..."],
			[0, "Meh"]
		];
		function getScoreClass(score){
			for(var i in scoreClasses) {
				//console.log(typeof score, typeof i, score >= parseInt(i))
				if (score >= scoreClasses[i][0])
					return scoreClasses[i][1];
			}
		}
		function renderRecommendedUsers(users) {
			var $out = $("<ul>").addClass("userList");
			for (var i=0; i<users.length; ++i) {
				var $li = _renderUserInList(users[i]);
				if (users[i].score) {
					users[i].score = Math.min(users[i].score, 1) * 100;
					var $box = $('<div class="recomBox">').text("Similarity")
						.append($('<div class="scoreClass">').text(getScoreClass(users[i].score)))
						.append('<div class="bar"><div style="width:'+users[i].score+'%;"></div></div>')
						//.append($('<div class="score">').text(users[i].score))
					if (users[i].artistNames && users[i].artistNames.length) {
						var artistNames = "";
						if (users[i].artistNames.length > 3) {
							artistNames = " + " + (users[i].artistNames.length - 3) + " other artists...";
							artistNames = users[i].artistNames.slice(0, 3).join(', ') + artistNames;
						}
						else
							artistNames = users[i].artistNames.join(', ');
						$box.append("<span>You both like: " + artistNames + "</span>");
					}
					$box.prependTo($li);
				}
				$out.append($li);
			}
			return $out.ajaxify ? $out.ajaxify() : $out;
		};
		var timeouts = [
			setTimeout(function(){
				$subtitle.text("Hang on... Your recommendations are on their way!");
			}, 7000),
			setTimeout(function(){
				$subtitle.text("Hmm... still waiting? Please try to refresh this page, and let us know if nothing shows up.");
			}, 14000)
		];
		$.get("/discover", { ajax: "recommendedUsers" }, function(json) {
			$(".loading").removeClass("loading");
			if (json && !json.error && json.users) {
				console.log(json.users);
				for (var i in timeouts)
					clearTimeout(timeouts[i]);
				if (json.users.length)
					$content
						.html("<h1>These recommendations are based on the tracks you shared and liked:</h1>")
						.append(renderRecommendedUsers(json.users));
				else {
					$subtitle.hide();
					$content.find(".nocontent").show();
				}
			}
			else
				(json || {}).error ? showMessage(json.error) : console.log("recomUsers error", json);
		});
	},
	"fbfriends": function($content) {
		function getFriends(fbId, fbAccessToken, cb) {
			var data = {ajax: "fbfriends"};
			if (fbId) data.fbUserId = fbId;//res.authResponse.userID
			if (fbAccessToken) data.fbAccessToken = fbAccessToken;
			$.ajax({
				type: "POST",
				url: "/api/fbfriends",
				data: data,
				complete: function(res, status) {
					try {
						if (status != "success" || !res.responseText) throw 0;
						var json = JSON.parse(""+res.responseText) || {};
						console.log("received", json);
						cb && cb(json);
					}
					catch(e) {
						cb && cb({error:e || "An error occured. Please try again."});
					}
				}
			});
		}
		function updateUi(json) {
			$("#fbConnect").removeClass("loading").unbind().click(fbConnect);
			$(".loading").removeClass("loading");
			if (json && !json.error && json.whydFriends) {
				$("#needFbConnect").hide();
				if (json.whydFriends.length) {
					$content
						.html("<h1>Facebook friends</h1>")
						.append(_renderUserList(json.whydFriends));
						//.append("Friends that are not yet on Whyd:")
						//.append(_renderUserList(json.notOnWhyd));
				}
				else
					$('#noFriends').show();
			}
			else {
				// prevents "[Object object]" error on "Error validating access token: Session has expired at unix time 1351612800. The current unix time is 1352105312.
				if (json && json.error && json.error.code != 190 && json.error.error_subcode != 463) {
					showMessage(json.error.message);
				}
				console.log("updateUi error", JSON.stringify((json || {}).error || json));
			}
		}
		function fbConnect() {
			console.log("fb connect...")
			$("#fbConnect").addClass("loading").unbind().click(function(e){
				e.preventDefault();
				showMessage("Still loading, please wait...");
			});
			fbAuth("", function(fbId, res) {
				if (!fbId)
					updateUi({error:"no fb login"});
				else
					getFriends(fbId, res.authResponse.accessToken, updateUi);
			});
			return false;
		}
		$("#fbConnect").click(fbConnect);
		getFriends(null, null, updateUi);
	}
};

$(function() {
	var $panel = $(".whitePanel");
	var $tabs = $("#bigTabSelector a")/*.removeClass("loading")*/.click(function() {
		/*$(this)*/$panel.addClass("loading");
	}).each(function(){
		var $tab = $(this);
		if (window.location.href.indexOf($tab.attr("href")) != -1) {
			$panel.addClass("loading");
			$tab.addClass("selected")/*.addClass("loading")*/;
			$(".section").hide();
			var $content = $($tab.attr("id").replace("tab", "#sec")).show();
			sections[$tab.attr("href").split("/").pop()]($content); // run section-specific code
		}
	});
});