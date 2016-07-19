// deprecated code from postbox.js:

//================ POST BOX (for the "add track dialog" on the main whyd ui, with real-time search and track preview)

function initPostBox($box, onPostComplete) {
	var $result = $box.find("#postBoxResults");//.hide();
	var $selPlaylist = $("#selPlaylist");//.hide();
	var $descForm = $("#postBoxForm");//.hide();
	var $text = $descForm.find('textarea');
	var $btnSubmit = $descForm.find("#btnSubmit");

	var whydPost = new WhydPost();
	var embedder = ContentEmbed();

	var currentResults = null;
	var $previewedResult = null;
	var previewedTrack = null;

	function setPreviewState(state) {
		$previewedResult.parent().parent().find(".play").removeClass("playing").removeClass("loading").removeClass("paused");
		$previewedResult.find(".play").addClass(state);
	}

	var scReady = false;
	var scPlayer = new SoundCloudPlayer({
		onEmbedReady: function(){
			scReady = true;
		},
		onPlaying: function() {
			setPreviewState("playing");
		},
		onPaused: function() {
			setPreviewState("paused");
		},
		onError: function(e) {
			console.log("soundcloud error: ", e);
		}
	});

	var $searchInput = $box.find(".q").click(function(){
		$box.removeClass("pickedTrack");
	});
	
	setTimeout(function(){
		$searchInput.focus();
	}, 500);

	function renderResult (r) {
		if (r.uNm)
			return '<li class="whyd" data-pid="'+r.id+'">'
				 + ' <a href="'+r.url+'" target="_blank" class="thumb-result">'
				 + '  <img src="'+r.img+'" alt="" width="76" height="76" />'
				 + '  <h3>'+ htmlEntities(r.name) +'</h3>'
				 + '  <div class="avatar" style="background-image:url(/img/u/'+r.uId+');"></div>'
				 + '  <p>added by <strong>'+r.uNm+'</strong></p>'
				 + (!r.noPreview ? '<span></span><div class="play"></div>' : '')
				 + '</a></li>';
		else
			return '<li class="'+(r.playerLabel || "").toLowerCase()+'">'
				 + ' <a href="'+(r.src ? r.src.id : r.url)+'" target="_blank" class="thumb-result">'
				 + '  <img src="'+r.img+'" alt="" width="76" height="76" />'
				 + '  <h3>'+ htmlEntities(r.name) +'</h3>'
				 + '  <p>via '+r.playerLabel+'</p>'
				 + (!r.noPreview ? '<span></span><div class="play"></div>' : '')
				 + '</a></li>';
	};

	function stopPreview() {
		$(".embed").remove();
		if (previewedTrack && previewedTrack.embedType.stop) {
			previewedTrack.embedType.stop();
			previewedTrack = null;
		}
		else if (scPlayer && scReady)
			scPlayer.pause();
	}

	function previewTune() {
		var $a = $previewedResult = $(this).parent();
		var url = $a.attr("href");

		stopPreview();
		setPreviewState("loading");
		if (window.whydPlayer)
			window.whydPlayer.pause();

		embedder.extractEmbedRef(url, function (embedRef) {
			if (embedRef && embedRef.embedType) {
				previewedTrack = embedRef;
				if (embedRef.embedType.play)
					embedRef.embedType.play(embedRef);
				else if (embedRef.id.indexOf("/sc/") == 0) {
					var trackId = embedRef.url.split("#")[1].split("/tracks/")[1];
					scPlayer.play(trackId);
				}
				else {
					var $embed = $('<div class="embed"></div>').appendTo($a);
					$embed.html(embedRef.embedType.render(embedRef, {autoplay:1}));
				}
			}
		});
		return false;
	}

	function checkTune(tune, setEmbedRef) {
		embedder.extractEmbedRef(tune.url, function (embedRef) {
			if (embedRef && embedRef.embedType)
				setEmbedRef(embedRef);
			else if (embedRef && tune.url.indexOf("http") == 0) {
				embedder.findTracksInPage(tune.name, tune.url, function(r) {
					//console.log("result", r);
					var firstEmbedRef = ((r || {}).embeds || [null])[0];
					if (firstEmbedRef && (firstEmbedRef.id || firstEmbedRef.type)) {
						if (firstEmbedRef.type && firstEmbedRef.type == "mp3 file")
							firstEmbedRef.id = tune.url + "#" + firstEmbedRef.url;
						firstEmbedRef.url = tune.url;
						firstEmbedRef.src = tune.src;
						firstEmbedRef.img = firstEmbedRef.img || tune.img;
						setEmbedRef(firstEmbedRef);
					}
					else
						setEmbedRef();
				});
			}
			else
				setEmbedRef();
		});
	}

	function selectTune(e) {
		quickSearch.cancelQuery();
		e && e.preventDefault && e.preventDefault();

		var $a = $(e && e.target ? e.target : this).closest("a");
		//$a.unbind().click(function(e){e.preventDefault();}); // don't open the link to track page on click
		var unselecting = $a.parent().hasClass("selected");

		$box.toggleClass("pickedTrack", !unselecting);
		$result.find("li.selected").removeClass("selected");
		//$result.find("li:not(.selected)").hide("hidden");
		//$selPlaylist.show();
		//$descForm.show();
		if (unselecting) {
			$searchInput.focus();
			return;
		}

		var tune = {
			pid: $a.parent().data("pid"),
			url: $a.attr("href"),
			name: $a.find("h3").text()
		};

		stopPreview();
		$a.parent().addClass("selected");
		$btnSubmit.addClass("loading").show();
		$text.focus().attr("placeholder", "Add a note about " + tune.name);

		checkTune(tune, function(embedRef) {
			console.log("final embedRef", tune, embedRef);
			if (embedRef)
				whydPost.setEmbedRef(embedRef);
			else
				window.showMessage && showMessage("Sorry, we can't find that track anymore... Please pick another one.", true);
			if (tune.pid)
				whydPost.setRepostPid(tune.pid);
			$btnSubmit.removeClass("loading").toggle(!!embedRef);
		});

		return false;
	}

	function onSubmitPost(text) {
		if ($btnSubmit.hasClass("loading"))
			return false;
		$btnSubmit.addClass("loading");
		stopPreview();
		// sample text: "pouet @[adrien](user:4ecb6ec933d9308badd7b7b4) test"
		console.log("WhydTextWithMentions RESULT:", text)
		whydPost.setText(text);
		whydPost.submit(true, function(pId, postObj){
			$btnSubmit.removeClass("loading");
			onPostComplete && onPostComplete(pId, postObj);
		});
	}

	var trackDescField = new WhydTextWithMentions(
		document.getElementById("text"), $btnSubmit[0], onSubmitPost);

	var defaultPlaylist = null;
	var urlSplit = window.location.href.split("/playlist/");
	if (urlSplit.length > 1)
		defaultPlaylist = {
			id: urlSplit[1],
			name: $("#playlistNameField").val()
		};

	(new WhydPlaylistSelector(whydPost, $selPlaylist, defaultPlaylist)).populate();

	var $filter = $result.find(".filter");

	function applyFilter() {
		var selected = $filter.find(".selected");
		if (selected.length) {
			selected = selected.attr("class").replace("selected","");
			$box.find("#results li").hide();
			$box.find("#results li."+selected).show();
		}
		else
			$box.find("#results li").show();
	}

	// init search engine filters
	for (var i in searchEngines)
		$('<div class="'+searchEngines[i].label.toLowerCase()+'">').click(function() {
			if ($(this).hasClass("selected")) {
				$filter.find("div").removeClass("selected");
				//$box.find("#results li").show();
			}
			else {
				$filter.find("div").removeClass("selected");
				$(this).addClass("selected");
				//$box.find("#results li").hide();
				//$box.find("#results li."+$(this).attr("class").replace("selected","")).show();
			}
			applyFilter();
		}).appendTo($filter);

	var quickSearch = new QuickSearch($box, {
		noMoreResults: true,
		noMoreResultsOnEnter: true,
		onResultClick: function(href, a) {
			$(a).each(selectTune);
			return false;
		},
		submitQuery: function(query, display) {
			// called a short delay after when a query was entered
			// display(htmlResults, stillSearch) is to be called when new results are found
			stopPreview();
			$box.removeClass("pickedTrack").addClass("withResults");
			//$descForm.hide();
			//$selPlaylist.hide();
			currentResults = [];
			display("", true); // clear the result list and keep the searching animation rolling
			$result.show();
			if (query.indexOf("http://") > -1 || query.indexOf("https://") > -1)
				embedder.extractEmbedRef(query, function (embedRef) {
					console.log("detected track url", embedRef);
					try {
						embedRef.playerLabel = embedRef.playerLabel || embedRef.embedType.label;
						currentResults = [embedRef];
						display(renderResult(embedRef), false);
						setTimeout(function() {
							$result.find(".play").unbind().click(previewTune);
							$result.find("li > a").first().each(selectTune);
						}, 50);
					}
					catch (e) {
						console.log(e, e.stack);
						display('<div class="noResults">'
							+ "<p>Sorry, we don't recognize this URL...</p>"
							+ "<p>We currently support URLs from Youtube, Soundcloud and Vimeo.</p>"
							+ '<p>Please install and try <a href="/button">our "Add Track" button</a> from that page.</p>'
							+ '</div>', false);
					}
				});
			else {
				var html = "", expected = 0, resultSet = {}, engines = [];

				// replace set to list
				for (var i in searchEngines)
					engines.push(searchEngines[i]);

				function appendResults(results) {
					for (var i in results)
						html += renderResult(results[i]);
					currentResults = currentResults.concat(results);
				}

				function triggerSearch(current) {
					engines[current].query(query, function(results) {
						resultSet[current] = results || [];
						if (expected == current) {
							for (; expected < engines.length && resultSet[expected]; ++expected)
								appendResults(resultSet[expected]);
							var lastQuery = expected == engines.length;
							if (lastQuery && !currentResults.length)
								display('<div class="noResults">'
									+ '<p>' + query + ' was not found on Youtube and Soundcloud</p>'
									+ '<p>Please try another query!</p>'
									+ '</div>', false);
							else {
								display(html, !lastQuery); // keep the searching animation rolling until results of last query
								$result.find(".play").unbind().click(previewTune);
								$result.find("li > a").unbind().click(selectTune);
								applyFilter();
							}
						}
					});
				}

				for (var i in engines)
					triggerSearch(i);
			}
		}
	});	

	var pageSearch = $("#header #searchForm input").val();
	if (pageSearch)
		quickSearch.search(pageSearch);

	window.onDialogClose = function() {
		stopPreview();
		delete window.onDialogClose;
	}
}

function modalPostBox(onPosted) {
	openRemoteDialog('/html/postBox.html', 'dlgPostBox', function($box){
		$("#postBoxSearch > p > a").click(function() {
			//$.modal.close();
			avgrundClose();
		});
		try { $box.ajaxify(); } catch(e) {}	
		initPostBox($box, function (pId, whydPost) {
			//$.modal.close();
			avgrundClose();
			if (onPosted)
				onPosted(whydPost);
		});
	});
}
