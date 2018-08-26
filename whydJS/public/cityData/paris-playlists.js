/**
 * Script for playlists.html
 * Ce script gère manuellement l'affichage des playlists (feature and blacklist)
 * @author: guillaumegaubert, whyd
 **/

/*var plDesc = {
    
   "50abb88b7e91c862b2a8ca33_43" : "This is another test just slightly longer for testing purpose only",
   "5045ef117e91c862b2a804f3_32" : "With deep rhythms, clanging beats and the rare sounds of originality, this playlist is epic beyond measure. Put on your seat belt, we're going for a ride",
   "5163d9657e91c862b2acd265_20" : "It's time to party: funky, swinging electro, and remixes galore of your favorite artists, from one of Paris's hippest music organizers",
   "501ff0057e91c862b2a7c4c8_32" : "Ringing melodies and strong voices abound in this folky playlist punctuated by bursts of electronic energy created by Whyd's Blonde Music Ninja",
   "50ef4f2b7e91c862b2a97b3b_14" : "Talk a walk through the history of Paris with this playlist crooning classics, swinging jazzy edits, and the pillars of French musical culture",
   "50bca67a7e91c862b2a91d33_13" : "Thumping jams, epic electro remixes, everything to dance and more, this playlist will keep you jamming for hours and hours",
   "50bcaf297e91c862b2a91d7c_3"  : "Bouncing between funky electro edits, oldies crooning, and post rock, this playlist brings something for everyone who loves the unexpected",
   "50abb88b7e91c862b2a8ca33_43" : "Ephemeral, seductive rock; classics mixed in with newcomers; this playlist creeps and blasts with unique sounds",
   "508c10d57e91c862b2a83a46_8"  : "World hip hop, long mixes, and the harder edge of electro, this playlist from a Paris artist promoter will get you twerking"
   
};*/

/*var PLAYLISTS_FEATURED = [

	"537215aa45b7b88c4fd8cf30_3",
	"537215aa45b7b88c4fd8cf30_4",
	"537a08b9ad6f7a0523e43a00_2",
	"537215aa45b7b88c4fd8cf30_2"
];*/

var PLAYLISTS_FEATURED = [
  '5307909a7e91c862b2b5b650_9', // Friend Playlist by Mark Daumail
  '53726f8971eaec19b57170bd_19', // Heavy Rotation 9 by Backpackerz
  '53bd1b4fe04b7b4fca7c3615_1', // Machine de Moulin Rouge
  '502d75f47e91c862b2a7fec2_7', // Summer2014 by James Martin
  '5370e0d771eaec19b5716414_10', // Paris by Allison Feuvier
  '50b367d97e91c862b2a8e1c0_11', // Cereal Summer by Peterbucks
  '50bcaf297e91c862b2a91d7c_4', // Summer 2014 by Sabrina
  '5370e0d771eaec19b5716414_11', // Summer by Allison Feuvier
  '5045ef117e91c862b2a804f3_39', // Summer by Aline
  '528759f07e91c862b2b0fd64_6', // Summer by Disquaires de Paris
  '53a98f2666491c17b2ae1236_21', // Summer by Didier Jean
  '52d274cb7e91c862b2b2d4b2_21', // Summer Pig Meat by DJ Halouf
  '52e629ac7e91c862b2b43cbd_17', // Paris vaut bien une Playlist by AFO
  '52e94f9c7e91c862b2b4a61a_10', // Summer rhymes with hip hop Sebastien
  '5163d9657e91c862b2acd265_22', // Summer 2014 by Green Room Session
  '53612ae771eaec19b5701af2_10', // La Piscine by Orpheo
  '51f282d87e91c862b2af6af4_0', // Sounds of Today by Leo Martin
  '500836f17e91c862b2a7c396_23', // Summer Sample by Jiess
  '51507ef57e91c862b2ac4878_5', // Un ete by ParisMix
  '50b634977e91c862b2a8f86e_8', // Summer remixes by Naive
  '537c65d471eaec19b571aa6e_0', // Paris by Charlotte Sindic
  '501ff0057e91c862b2a7c4c8_11', // Summer by Laurène
  '537ce33d71eaec19b571adf3_3', // Summer Playlist Open Space
  '5350f3d871eaec19b56fd481_2', // My Selecta by T.Boon
  '530947277e91c862b2b5c341_0', // Au-dela du R.L. by Y. Dubois
  '52e629ac7e91c862b2b43cbd_7', // Fortissimo by AFO
  '53d8e5b2e04b7b4fca7ce4e8_10' // Paris Superstar by Bsynthe
];

var PLAYLISTS_TOP = [
  {
    index: 0,
    id: '52f4e8bc7e91c862b2b52837_10',
    name: '#Paristechno',
    nbTracks: 15,
    plId: 10,
    uId: '52f4e8bc7e91c862b2b52837',
    uNm: 'Trax Magazine'
  },

  {
    index: 1,
    id: '5278f7427e91c862b2b0d3f6_8',
    name: '#Paris - Best of #Tracks',
    nbTracks: 7,
    plId: 8,
    uId: '5278f7427e91c862b2b0d3f6',
    uNm: 'TRACKS / Arte'
  },

  {
    index: 2,
    id: '52df0c0e7e91c862b2b38480_5',
    name: 'Crush On You #4 #April 2014',
    nbTracks: 33,
    plId: 5,
    uId: '52df0c0e7e91c862b2b38480',
    uNm: 'don rimini'
  }
];

var PLAYLISTS_BLACKLIST = [
  '50bca67a7e91c862b2a91d33_13',
  '50990e7a7e91c862b2a841ab_167',
  '51803b7a7e91c862b2adc459_0',
  '533a8d1f71eaec19b56f7d72_0'
];

//var PLAYLISTS_ORDER = ["52f4e8bc7e91c862b2b52837_10", "5278f7427e91c862b2b0d3f6_8"];
