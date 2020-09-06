/**
 * playlistcontest template
 * @author: adrienjoly, whyd
 **/

var config = require('../models/config.js');
var mongodb = require('../models/mongodb.js');
var uiSnippets = require('../templates/uiSnippets.js');
var templateLoader = require('../templates/templateLoader.js');
var TEMPLATE_FILE = 'app/templates/playlistcontest.html';

var template = null;

exports.refreshTemplates = function (cb) {
  templateLoader.loadTemplate(TEMPLATE_FILE, function (tmp) {
    template = tmp;
    cb && cb(tmp);
  });
};

exports.refreshTemplates();

var i18n = {
  EN: {
    h1: 'Create a playlist contest',
    /*t1: "Overview",*/
    c1:
      'Playlist contests engage your community and helps you grow your fans by engaging the Openwhyd community too.',
    t2: 'Engage and reward your community',
    c2: [
      {
        li:
          'Encourage your audience to dig deeper and identify your personality',
      },
      { li: 'Give people an option to participate, and declare their tastes' },
      {
        li:
          'Reward your community by featuring their playlists or with other prizes!',
      },
    ],
    t3: 'Engage the Openwhyd community and grow your audience',
    c3: [
      {
        li:
          'Whyd music lovers are constantly searching for new music, engage them by offering a chance to get to know your site',
      },
      { li: 'Grow the number of fans for your site/project' },
    ],
    /*t4: "How does it work?",
		c4: [
			{li: "You create a playlist contest with the name of your site/brand/project/event, giving people a starting point to build a playlist, and choose dates that you’d like the contest to begin and end (optimal time is two weeks)."},
			{li: "You copy and paste the rules (see below) into a post on your site, or other announcements via social media."},
			{li: "Participants go to Openwhyd to create a playlist with the title you select."},
			{li: "Whyd will feature the contest and push it out to all users across the site, plus provide support on social media and individual invitations to key users."},
			{li: "Participants then share their playlists as much as possible. Every time a playlist is shared it is shared with your name (because it’s the title)."},
			{li: "Listeners can find the playlists by searching for the title, and then vote by sharing it to their networks via FB and Twitter. But most people will be driven to listen to the playlists by the participant themselves!"},
			{li: "The top three most-shared playlists (judged by the counters for FB and Twitter shares) are the finalists, and the winner is then selected by you to be featured on your site or receive another great prize or your choosing!"},
		],*/
    t5: 'BREAKDOWN: Who does what?',
    c5: [
      {
        h: 'You',
        ul: [
          {
            li:
              'You create a playlist contest with the name of your site/brand/project/event, giving people a starting point to build a playlist, and choose a date that you’d like the contest to end (optimal time is two weeks).',
          },
          {
            li:
              'You copy and paste the rules into a post on your site, or other announcements via social media.',
          },
          {
            li:
              'You support your audience by getting them excited to participate!',
          },
          {
            li:
              'The top three most-shared playlists (judged by the counters for FB and Twitter shares) are the finalists, and the winner is then selected by you to be featured on your site or receive another great prize!',
          },
        ],
      },
      {
        h: 'Participants',
        ul: [
          {
            li:
              'Participants go to Openwhyd to create a playlist with the title you select.',
          },
          {
            li:
              'Participants then share their playlists as much as possible. Every time a playlist is shared it is shared with your name (because it’s the title)',
          },
          { li: 'The winner will share again the victory page!' },
        ],
      },
      {
        h: 'Whyd',
        ul: [
          {
            li:
              'Whyd identifies the playlist and adds the necessary features to enable clear voting.',
          },
          {
            li:
              'Whyd will feature the contest and push it out to all users across the site, plus provide support on social media and individual invitations to key users.',
          },
        ],
      },
    ],
    t6: 'Copy and Paste (or completely rewrite) the basics for your site:',
    t7: 'Contest Rules & Instructions',
    c7: [
      {
        p:
          'Make a playlist titled [[YOURNAME]] on Openwhyd (use this invite link to sign up if you are not already a member)',
      },
      {
        p:
          'Add tracks to the playlist (at least XX tracks) that reflect our style.',
      },
      {
        p:
          'Share this playlist as much as possible on FB and Twitter, the top 3 most-shared playlists (according to the tickers on the playlists) are finalists.',
      },
      { p: 'The best playlist will be featured on our site' },
    ],
    btnCreate: 'Create a playlist contest',
    fldTitle: {
      legend: 'Title',
      placeholder: 'Best tracks of 2012',
    },
    fldOrganizer: {
      legend: 'Organizer',
      btnLogin: 'Log in as another user',
    },
    fldPage: {
      legend: 'Contest page URL',
      placeholder: 'http://cocacola.fr/whyd-playlist-contest',
    },
  },
  //////////////////
  FR: {
    h1: 'Créer une compétition de playlists',
    c1:
      'Les concours de playlist engagent votre communauté et aident à monter votre fan base avec les music lovers de Openwhyd aussi!',
    t2: 'Engagez et Récompensez votre communauté',
    c2: [
      { li: 'Encouragez votre audience à mieux connaître votre identité' },
      {
        li:
          'Donnez la possibilité de participer et déclarer leurs goûts musicaux',
      },
      {
        li:
          "Récompensez votre communauté en relayant leurs playlists ou avec d'autres prix!",
      },
    ],
    t3: 'Engagez la communauté Openwhyd et montez votre audience',
    c3: [
      {
        li:
          'Les membres de Openwhyd sont des diggers de sons, engagez avec eux et mettez en avant votre site.',
      },
    ],
    t5: 'BREAKDOWN: Qui fait quoi ?',
    c5: [
      {
        h: 'Vous',
        ul: [
          {
            li:
              'Vous créez un concours de playlist avec le nom de votre site/marque/projet/évènement pour donner aux gens un point de départ pour construire une playlist. Puis, vous sélectionnez une date de fin de concours (le période optimale est deux semaines)',
          },
          {
            li:
              'Copiez et collez les régles dans un article/post sur votre site et media sociaux.',
          },
          { li: 'Engager votre audience autour du concours.' },
          {
            li:
              "Les trois playlists les plus partagées (selon les stats de partage via FB ou Twitter) seront finalistes, et c'est à vous de choisir le vainqueur!",
          },
        ],
      },
      {
        h: 'Participants',
        ul: [
          {
            li:
              'Les participants vont sur Openwhyd pour créer leurs playlists avec le nom de votre site/marque/projet/évènement que vous avez sélectionné.',
          },
          {
            li:
              "Les participants partagent leurs playlists au maximum via les réseaux sociaux. Chaque fois qu'une playlist est partagée, le nom de votre site/marque/projet/évènement est partagé.",
          },
          { li: 'Le vainqueur partage encore!' },
        ],
      },
      {
        h: 'Whyd',
        ul: [
          {
            li:
              'Whyd identifie les playlists officielles et ajoute les boutons de vote',
          },
          {
            li:
              'Whyd présente le concours, le partage sur les media sociaux, diffuse sur la home du site, et envoie des invitations spéciales à ses membres clés.',
          },
        ],
      },
    ],
    t6:
      'Copiez et Collez (ou récrire complètement) les règes de base pour votre site:',
    t7: 'Règles et Instructions',
    c7: [
      {
        p:
          "Créez une playlist avec le titre {{VOTRE NOM DE SITE}} sur Openwhyd (utilisez ce lien d'invite si vous n'êtes pas encore un membre)",
      },
      { p: 'Ajoutez {{NUMÉRO MINIMUM}} des tracks qui reflètent votre style.' },
      {
        p:
          'Partagez votre playlist au maximum sur Facebook et Twitter, les trois playlists les plus partagées (voir stats sur les playlists) seront finalistes.',
      },
      {
        p:
          'La meilleure des trois playlists sera présentée comme vainqueur sur notre site!',
      },
    ],
    btnCreate: 'Proposer une compétition!',
  },
};

// fill the holes in FR version
var defaultI18n = i18n['EN'];
for (let i in defaultI18n) i18n['FR'][i] = i18n['FR'][i] || defaultI18n[i];

// === views ===

function renderLink(url) {
  return '<a href="' + url + '">' + url + '</a>';
}

exports.renderInfoPage = function (plC) {
  var safe = {};
  for (let i in plC) safe[i] = uiSnippets.htmlEntities(plC[i]);
  return [
    '<div class="whitePanel">',
    '<h1>Your playlist contest is active!</h1>',
    '<p>Title: ' + safe.title + '</p>',
    '<p>Organizer: ' +
      uiSnippets.htmlEntities((mongodb.usernames[plC.uId] || {}).name) +
      '</p>',
    '<p>URL: ' + renderLink(safe.url) + '</p>',
    '<p>Openwhyd URL (redirection): ' +
      renderLink(config.urlPrefix + '/playlistcontest/' + safe.uri) +
      '</p>',
    '<p>=> JOIN URL: ' +
      renderLink(config.urlPrefix + '/playlistcontest/' + safe.uri + '/join') +
      ' (to include in your contest page, for candidates to join)</p>',
    '</div>',
  ].join('\n');
};

exports.renderJoinPage = function (plC) {
  var safe = {};
  for (let i in plC) safe[i] = uiSnippets.htmlEntities(plC[i]);
  return [
    '<div class="whitePanel">',
    '<h1>Join: ' + safe.title + '</h1>',
    '<img src="/img/u/' + plC.uId + '">',
    '</div>',
  ].join('\n');
};

exports.renderListPage = function (list) {
  var html = ['<div class="whitePanel">', '<h1>Playlist contests</h1>', '<ul>'];
  for (let i in list) {
    var plHtml = '';
    for (let j in list[i].playlists) {
      var plId = list[i].playlists[j].split('_');
      plHtml +=
        '<li><a href="/u/' +
        plId[0] +
        '/playlist/' +
        plId[1] +
        '">' +
        uiSnippets.htmlEntities((mongodb.usernames[plId[0]] || {}).name) +
        '</a></li>';
    }
    html.push(
      '<li>' +
        '<a href="' +
        config.urlPrefix +
        '/playlistcontest/' +
        list[i].uri +
        '/info">' +
        uiSnippets.htmlEntities(list[i].title) +
        '</a>' +
        ', ' +
        (list[i].playlists || []).length +
        ' candidates:' +
        '<ul>' +
        plHtml +
        '</ul></li>'
    );
  }
  return html.concat(['</ul>', '</div>']).join('\n');
};

exports.renderCreatePage = function (p) {
  p.i18n = (p.lang && i18n[p.lang]) || i18n['EN'];
  return template.render(
    p /*{
		loggedUser: loggedUser,
		i18n: (getParams.lang && i18n[getParams.lang]) || i18n["EN"]
	}*/
  );
};
