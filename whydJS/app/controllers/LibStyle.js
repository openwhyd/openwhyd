/**
 * LibStyle class
 * fetchs and renders stream of tracks of a given style
 * @author adrienjoly, whyd
 **/

var postModel = require("../models/post.js");
var feedTemplate = require("../templates/feed.js");

var uidLists = {
	urban: [
		"4fe2d9ee7e91c862b2a7c277", // marwan
		"5047c9297e91c862b2a805cb", // bastien (recom by marwan)
		"506c25a97e91c862b2a8239e", // what (recom by marwan)
		"50b2941b7e91c862b2a8e09d", // LR
		"5045eed47e91c862b2a804e7", // Olivier Dizier
		"512ba8757e91c862b2ab1ae5", // Mauricio Estrada Munoz
		"4fe0f8b57e91c862b2a7c274", // Masscut
		"4e61ec47981d90d694c13657", // Kien - RAP SLAM HIPHOP
		"51430f4e7e91c862b2ab552e", // Mika Mikaz
	]/*,
	indie: [
		adrien/playlist/34
		manisnotabird (this is my band's profile, containing a lot indie from several bands)
		musiclikedirt
		500836f17e91c862b2a7c396 (nicolet, from point FMR)
		50b3a5f57e91c862b2a8e51a (de Boysson)
		50a9364d7e91c862b2a8a748 (dévina)
		camille/playlist/13
		51069b0f7e91c862b2aa7c64/playlist/3 (henri garnier)
		514734dc7e91c862b2ab5e2f (frank e. almeida)	
	],
	jazz: [
		dontfearmistakes (paris jazz scene)
	]
	*/
};

/*
GET		/style/urban					-> controllers.userLibrary
GET		/style/rock						-> controllers.userLibrary
GET		/style/punk						-> controllers.userLibrary
GET		/style/rave						-> controllers.userLibrary
GET		/style/sweet					-> controllers.userLibrary
GET		/style/folk						-> controllers.userLibrary
GET		/style/dance					-> controllers.userLibrary
GET		/style/electronica				-> controllers.userLibrary
GET		/style/acoustic					-> controllers.userLibrary
GET		/style/soul						-> controllers.userLibrary
GET		/style/funk						-> controllers.userLibrary
*/

function renderFriendsFeed (options, uidList, callback) {
	var params = {
		after:options.after,
		before:options.before,
		//limit:limit
	};
	postModel.fetchByAuthors(uidList, params, function process (posts) {
		/*
		if (!options.after && !options.before) {// rendering full page => including sidebar
			contestModel.fetchLast(function(contest){
				if (contest && contest.title)
					options.playlistContest = contest;
				feedTemplate.renderFeedAsync(posts, options, callback);
			});
		}
		else*/
			feedTemplate.renderFeedAsync(posts, options, callback);
	});
}

function renderFriendsLibrary (lib, style) {

	var uidList = uidLists[style];

	if (!uidList)
		return lib.renderPage({}, null, "hmmm... we have no selection of tracks for this style yet!");

	var options = lib.options;
	var uid = options.loggedUser.id;
	options.bodyClass = "pgStream pgWithSideBar";
	options.streamTitle = "Style: " + style;
	options.displayPlaylistName = true;



	renderFriendsFeed(options, uidList, function(feedHtml){
		if (options.after || options.before)
			lib.render({html:feedHtml});
		else {
			/*
			lib.renderSidebar(uidList, null/ *user* /, options, function(sidebarHtml){
				lib.renderPage(user, / *sidebarHtml* / null, feedHtml);
			});
			*/
			lib.renderPage({}, /*sidebarHtml*/ null, feedHtml);
		}
	});
}

exports.render = renderFriendsLibrary;