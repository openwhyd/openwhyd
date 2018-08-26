db = db.getSiblingDB('openwhyd_data');

db.user.update(
  { _id: ObjectId('4d94501d1f78ac091dbc9b4d') },
  {
    $set: {
      pl: [
        { id: '1', name: 'classical & epic' },
        { id: '2', name: 'rock' },
        { id: '3', name: 'metal & violence' },
        { id: '4', name: 'math-rock / indie-rock' },
        { id: '5', name: 'post-punk / post-hardcore' },
        { id: '6', name: 'covers + fun' },
        { id: '7', name: 'pop rock' },
        { id: '8', name: 'chill out' },
        { id: '9', name: 'urban / hip-hop' },
        { id: '10', name: 'electronica' },
        { id: '11', name: 'soul / funk / jazz / etc...' },
        { id: '12', name: 'post-rock / progressive' },
        { id: '13', name: 'hipster, fresh, trendy & vintage keyboards' },
        { id: '14', name: 'nostalgia' },
        { id: '17', name: 'fat bass / this is a trap, mothafucka!' },
        { id: '18', name: 'music in wonderland' },
        { id: '19', name: 'bar tunes' },
        { id: '20', name: 'rainy day' },
        { id: '21', name: 'We Are The Lions #53' },
        { id: '22', name: 'beautiful songs' },
        { id: '23', name: 'paranormal intensity' },
        { id: '24', name: 'acoustic delight' },
        { id: '25', name: 'calage' },
        { id: '26', name: 'bien de chez nous' },
        { id: '27', name: 'r4ve p4rtY' },
        { id: '28', name: 'indus / cold' },
        { id: '29', name: 'music = art, a.k.a wtf?!' },
        { id: '30', name: 'hit the road' },
        { id: '31', name: "today's the day" },
        { id: '32', name: 'Man Is Not A Bird (my band)' },
        { id: '33', name: 'celebration!' },
        { id: '34', name: 'indie rock / shoegaze' },
        { id: '35', name: 'aliens are coming!' },
        { id: '36', name: 'brainf*ck' },
        { id: '37', name: 'lullabies' },
        { id: '38', name: 'on va tout mettre en vrac!' },
        { id: '39', name: 'aLIVE' },
        { id: '40', name: 'girls + guitars = hot' },
        { id: '41', name: 'the lounge' },
        { id: '42', name: 'words + music' },
        { id: '43', name: 'mesmerizing tracks (a.k.a musical weed)' },
        { id: '44', name: 'red hot tracks' },
        { id: '45', name: 'still awake at night' },
        { id: 46, name: 'sales gosses!' },
        { id: 47, name: 'Fluff Fest 2013 - HxC discoveries' },
        { id: 48, name: 'Testing speakers' },
        { id: 49, name: 'Whyd Spring Playlist' },
        { id: 50, name: 'Emerging rock talent from Paris' },
        { id: 51, name: 'slow down' },
        { id: 52, name: 'apéro!' },
        { id: 53, name: 'epic coding session soundtrack' },
        { id: 54, name: 'Jamendo Playlist Contest' },
        { id: 55, name: 'Lama Land' },
        { id: 56, name: 'Février 2015' },
        { id: 57, name: 'Sawadee Krap / Relaxing tunes heard in Thailand' },
        { id: 58, name: 'Hangover' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('4e69f1a8981d90d694c13bd0') },
  {
    $set: {
      pl: [
        { id: 0, name: 'En ce moment' },
        { id: 1, name: 'Paix' },
        { id: 2, name: 'Jazz' },
        { id: 3, name: 'Rock' },
        { id: 4, name: 'HH' },
        { id: 5, name: 'Apero no stress - COOL' },
        { id: 6, name: 'Apero no stress - SHAKE' },
        { id: 7, name: 'Dubstep' },
        { id: 8, name: '2015-02' },
        { id: 9, name: 'Boiler Rooms & co' },
        { id: 10, name: '2015-03' },
        { id: 11, name: '2015-05' },
        { id: 12, name: '2015-07.08' },
        { id: 13, name: '2015-09.10.11.12' },
        { id: 14, name: '2016-01.02' },
        { id: 15, name: '2016 spring' },
        { id: 16, name: '2016 summer' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('5045ef117e91c862b2a804f3') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Rock - psychedelic rock' },
        { id: 1, name: 'Hip Hop' },
        { id: 2, name: 'Cosmic' },
        { id: '3', name: 'Make love' },
        { id: 4, name: 'Kifoof Killadisco Mix' },
        { id: 5, name: 'Juicy Funk' },
        { id: 6, name: 'Dubstep baby!' },
        { id: 7, name: 'Ondes positives' },
        { id: 8, name: 'electro et break beats' },
        { id: 9, name: 'Groovy' },
        { id: 10, name: 'Bad girlz' },
        { id: 11, name: 'Roots Rock Reggae ' },
        { id: 12, name: 'Abstrakt' },
        { id: 13, name: 'Dans ta face' },
        { id: 14, name: 'Mode posé' },
        { id: 15, name: 'Dirty ' },
        { id: 16, name: 'Trip' },
        { id: '17', name: 'Fev. 13' },
        { id: 18, name: 'Mars 13' },
        { id: '19', name: 'Douceur ' },
        { id: 20, name: 'Avril 13' },
        { id: '21', name: 'Mai 13' },
        { id: 22, name: 'Smile !!' },
        { id: 23, name: 'TECHNO IS BEAUTIFUL' },
        { id: 24, name: 'Mini Male' },
        { id: 25, name: 'DEEP' },
        { id: 26, name: 'ELECTRO CLASH' },
        { id: 27, name: 'Summer songs' },
        { id: 28, name: 'ExperiMental' },
        { id: 29, name: 'DNB' },
        { id: 30, name: 'Classix HH' },
        { id: 31, name: 'Hip Hop FR' },
        { id: 32, name: '#Paris ' },
        { id: 35, name: 'Latin' },
        { id: 36, name: 'DAFT PUNK ATOM C2C REMIXES ' },
        { id: 37, name: 'Sunshine' },
        { id: 38, name: 'Made in France' },
        { id: 39, name: '#summer in #paris playlist' },
        { id: 40, name: 'Free Party' },
        { id: 41, name: "My buddy's mixes, remixes and sounds" },
        { id: 43, name: 'ACID' },
        { id: 44, name: 'New Wave ' },
        { id: 45, name: 'Meu Portugal' },
        { id: 46, name: 'CINEMA' },
        { id: 47, name: "PUNK'S NOT DEAD" },
        { id: 48, name: 'INDIE ' },
        { id: 49, name: 'RoadTripSF' },
        { id: 50, name: 'Woop !' },
        { id: 51, name: 'HOUSE' },
        { id: 52, name: 'CLASSIQUE' },
        { id: 53, name: 'ACOUSTIC ' },
        { id: 54, name: 'PIKNIC BARCELONA' },
        { id: 55, name: 'Lazy sunday' },
        { id: 56, name: 'BaSs MuSic ' },
        { id: 57, name: 'DJ ACROBAT' },
        { id: 58, name: 'MADCHESTER' },
        { id: 59, name: 'DANCEHALL RAGGA' },
        { id: 60, name: 'WE LOVE GREEN 2016' },
        { id: 61, name: 'DUB' },
        { id: 62, name: 'britpop' },
        { id: 63, name: 'AWAKEING 2016 ' },
        { id: 64, name: 'Fusion Reggae' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('50bcead57e91c862b2a91ffa') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Février 2013' },
        { id: 1, name: 'Mars 2013' },
        { id: 2, name: 'Janvier 2013' },
        { id: 3, name: 'Mix' },
        { id: 4, name: 'Classic' },
        { id: 5, name: 'Avril 2013' },
        { id: 6, name: 'Septembre 2013' },
        { id: 7, name: 'Octobre 2013' },
        { id: 8, name: 'Novembre 2013' },
        { id: 9, name: 'Décembre 2013' },
        { id: 10, name: 'Janvier 2014' },
        { id: 11, name: 'Février 2014' },
        { id: 12, name: 'Doux' },
        { id: 13, name: 'Mars 2014' },
        { id: 14, name: 'Chaleur' },
        { id: 15, name: 'AVRIL 2014' },
        { id: 16, name: 'AVRIL 2014' },
        { id: 17, name: 'MAI 2014' },
        { id: 18, name: 'Juin 2014' },
        { id: 19, name: 'JUILLET 2014' },
        { id: 20, name: 'Classique ' },
        { id: 21, name: 'Aout 2014' },
        { id: 22, name: 'Septembre 2014' },
        { id: 23, name: 'Octobre 2014' },
        { id: 24, name: 'Octobre 2014' },
        { id: 25, name: 'Novembre 2014' },
        { id: 26, name: 'Décembre 2014' },
        { id: 27, name: 'Janvier 2015' },
        { id: 28, name: 'Février 2015' },
        { id: 29, name: 'Mars 2015' },
        { id: 30, name: 'Avril 2015' },
        { id: 31, name: 'Septembre 2015' },
        { id: 32, name: 'Septembre 2015' },
        { id: 33, name: 'Juin 2016' },
        { id: 34, name: 'JUILLET 2016' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('50ef4f2b7e91c862b2a97b3b') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Artastic' },
        { id: '1', name: 'Did you hear that sample ?' },
        { id: '2', name: 'Mental instru Mental' },
        { id: '3', name: "Your brain is breakdancin'" },
        { id: '4', name: 'Food for Hip hop lovers' },
        { id: 5, name: 'Sunny day' },
        { id: 6, name: 'Cinematic sensations' },
        { id: 7, name: 'Funky, souly and stuff' },
        { id: 8, name: 'Stuff & Gong' },
        { id: 9, name: 'Dusty vintage' },
        { id: 10, name: 'Good time with Thiago de Camargo' },
        { id: 11, name: 'Beatlicious' },
        { id: 12, name: 'Kla6' },
        { id: 13, name: 'Our vinyl weighs a ton by Stones Throw Records' },
        { id: 14, name: '"Paris Clichayz\' #Paris' },
        { id: 15, name: "Stoned between the 60's and the 70's" },
        { id: 16, name: 'Whyd Spring Playlist' },
        { id: 17, name: 'FRIDAY @SOLIDAYS 2014' },
        { id: 18, name: 'SATURDAY @SOLIDAYS' },
        { id: 20, name: 'GOD aka "Gourmandise Of the Day"' },
        { id: 22, name: 'Celtic Spirit' },
        { id: 23, name: 'Jamendo Playlist Contest' },
        { id: 24, name: "That's what I call English music!" },
        { id: 25, name: 'Mashups & Bootlegs' },
        { id: 26, name: 'WTFM (aka What The Fuck Music)' },
        {
          id: 28,
          name: 'Break beats and grooves from the Atlantic and Warner vaults'
        },
        {
          id: 29,
          name: 'Weirdsville style (exotic,  heavy psych, mind traveling...)'
        },
        { id: 30, name: '¡Argentina¡' },
        {
          id: 31,
          name: 'Amérique Latine : "La pêche aux sons" aka "La paix chaussons"'
        },
        { id: 32, name: '"8T" gems' },
        { id: 33, name: 'Library classics KPM' },
        { id: 34, name: 'GTA radios' },
        { id: 35, name: 'Full mixes : Boiler Roomz & co' },
        { id: 36, name: 'Do you wanna party?' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('5107d56c7e91c862b2aa8700') },
  {
    $set: {
      pl: [
        { id: '4', name: 'in da august 2012' },
        { id: '5', name: 'in da september 2012' },
        { id: '6', name: 'in da october 2012' },
        { id: '7', name: 'in da november 2012' },
        { id: '8', name: 'In da december 2012' },
        { id: '9', name: 'My best of 2012' },
        { id: '10', name: 'In da january 2013 part I' },
        { id: '11', name: 'In da january 2013 part II' },
        { id: '12', name: 'in da february 2013 ' },
        { id: '13', name: 'In da mars 2013' },
        { id: '14', name: 'in da Avril 2013' },
        { id: '15', name: 'Daft Punk Best remixes/Daft Punk Day' },
        { id: '16', name: 'In da may 2013' },
        { id: '17', name: 'in da June 2013' },
        { id: 18, name: 'in da july 2013' },
        { id: 19, name: 'in da august 2013' },
        { id: 20, name: 'in da september 2013' },
        { id: 21, name: 'Edits // Remixes // Reworks' },
        { id: 22, name: 'in da october 2013' },
        { id: 23, name: 'in da november 2013' },
        { id: 24, name: 'in da December 2013' },
        { id: 25, name: 'In da Janvier 2014' },
        { id: 27, name: 'in da february 2014' },
        { id: 28, name: 'in da march 2014' },
        { id: 29, name: 'in da April 2014' },
        { id: 30, name: 'in da may 2014' },
        { id: 31, name: 'in da june 2014' },
        { id: 32, name: 'in da july 2014' },
        { id: 33, name: 'in da september 2014' },
        { id: 34, name: 'in da october 2014' },
        { id: 35, name: 'in da november 2014' },
        { id: 36, name: 'in da december 2014' },
        { id: 37, name: 'in da january 2015' },
        { id: 38, name: 'in da february 2015' },
        { id: 39, name: 'in da march 2015' },
        { id: 40, name: 'in da april 2015' },
        { id: 41, name: 'in da may 2015' },
        { id: 42, name: 'in da june 2015' },
        { id: 44, name: 'in da july 2015' },
        { id: 45, name: 'in da august 2015' },
        { id: 46, name: 'in da september 2015' },
        { id: 47, name: 'in da october 2015' },
        { id: 48, name: 'in da december 2015' },
        { id: 49, name: 'in da january 2016' },
        { id: 50, name: 'in da february 2016 ' },
        { id: 51, name: 'in da march 2016' },
        { id: 52, name: 'in da april 2016' },
        { id: 54, name: 'in da may 2016' },
        { id: 55, name: 'in da june 2016' },
        { id: 56, name: 'in da july 2016' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('514cc0c47e91c862b2ac14d9') },
  {
    $set: {
      pl: [
        { id: 0, name: 'electro' },
        { id: 1, name: 'jazz' },
        { id: '2', name: 'autres' },
        { id: 3, name: '1986' },
        { id: 4, name: "Rock'n'Roll" },
        { id: 6, name: 'salsa' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('515391a07e91c862b2ac6631') },
  {
    $set: {
      pl: [
        { id: '0', name: 'Sample' },
        { id: 1, name: 'January 2013' },
        { id: 2, name: 'February 2013' },
        { id: 3, name: 'March 2013' },
        { id: 4, name: 'April 2013' },
        { id: 5, name: 'May 2013' },
        { id: 6, name: 'June 2013' },
        { id: 14, name: 'July 2013' },
        { id: 15, name: 'British Invasion' },
        { id: 16, name: 'August 2013' },
        { id: 17, name: 'September 2013' },
        { id: 18, name: 'October 2013' },
        { id: 19, name: 'November 2013' },
        { id: 20, name: 'December 2013' },
        { id: 23, name: 'January 2014' },
        { id: 24, name: 'February 2014' },
        { id: 25, name: 'March 2014' },
        { id: 26, name: 'April 2014' },
        { id: 27, name: 'May 2014' },
        { id: 28, name: 'June 2014' },
        { id: 29, name: 'July 2014' },
        { id: 30, name: 'August 2014' },
        { id: 31, name: 'September 2014' },
        { id: 32, name: 'October 2014' },
        { id: 33, name: 'November 2014' },
        { id: 34, name: 'Collective Soul' },
        { id: 35, name: 'December 2014' },
        { id: 36, name: 'Artist To Watch In 2015' },
        { id: 37, name: 'January 2015' },
        { id: 38, name: 'February 2015' },
        { id: 39, name: "Valentine's Day Playlist [2015]" },
        { id: 40, name: 'Singles Awareness Day [2015]' },
        {
          id: 42,
          name:
            '10 Tracks To Add To Your Party Playlist V.1 (Mardi Gras Edition) '
        },
        { id: 43, name: 'March 2015' },
        { id: 44, name: 'April 2015' },
        { id: 45, name: 'May 2015' },
        { id: 46, name: 'June 2015' },
        { id: 47, name: 'July 2015' },
        { id: 48, name: 'August 2015' },
        { id: 49, name: 'September 2015' },
        { id: 50, name: 'October 2015' },
        { id: 51, name: 'November 2015' },
        { id: 52, name: 'December 2015' },
        { id: 53, name: '2016' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('51b22eb47e91c862b2ae9220') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Maisonette' },
        { id: 1, name: 'Roofgarden' },
        { id: 2, name: 'Balcony' },
        { id: 3, name: 'Attic Flat' },
        { id: 4, name: 'Handsomely' },
        { id: 5, name: 'Good Manners' },
        { id: 6, name: 'Moto' },
        { id: 7, name: 'Germinate' },
        { id: 8, name: 'Tincture' },
        { id: 9, name: 'Boodle' },
        { id: 10, name: 'BLAINE' },
        { id: 11, name: 'Chauffeur' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('51f6e1e57e91c862b2af7923') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Music Videos (Official)' },
        { id: 1, name: 'Unsorted' },
        { id: 2, name: 'Via Other Users' },
        { id: 3, name: 'DnB' },
        { id: 4, name: 'Laidback' },
        { id: 5, name: 'Trance' },
        { id: 6, name: 'Dubstep' },
        { id: 7, name: 'Live' },
        { id: 8, name: 'Mashups' },
        { id: 9, name: 'Relax' },
        { id: 10, name: 'Bootlegs' },
        { id: 12, name: 'House' },
        { id: 13, name: 'Not Released Yet' },
        { id: 14, name: 'World' },
        { id: 15, name: 'Oldskool' },
        { id: 16, name: 'Trance (Vocal)' },
        { id: 17, name: 'Long' },
        { id: 18, name: 'Via Other Users - Long' },
        { id: 19, name: 'Unsorted (with voiceover)' },
        { id: 20, name: 'Trance (Psy)' },
        { id: 21, name: 'Covers' },
        { id: 23, name: 'Full Albums (Not listened through)' },
        { id: 24, name: 'Music Videos (Unofficial)' },
        { id: 25, name: '2014-04-26' },
        { id: 26, name: '2014-04-27' },
        { id: 27, name: '2014-04-28' },
        { id: 28, name: '2014-05-02' },
        { id: 29, name: '2014-05-03' },
        { id: 30, name: 'Not Full Track' },
        { id: 31, name: '2014-05-04' },
        { id: 32, name: '2014-05-05' },
        { id: 33, name: '2014-05-07' },
        { id: 34, name: '2014-05-08' },
        { id: 35, name: '2014-05-13' },
        { id: 36, name: '2014-05-15' },
        { id: 37, name: '2014-05-16' },
        { id: 38, name: '2014-05-17' },
        { id: 39, name: '2014-05-18' },
        { id: 40, name: 'Not found on Spotify' },
        { id: 41, name: '2014-05-23' },
        { id: 42, name: '2014-05-26' },
        { id: 43, name: '2014-05-30' },
        { id: 44, name: '2014-05-31' },
        { id: 45, name: '2014 - June' },
        { id: 46, name: '2014 - July' },
        { id: 47, name: '2014 - August' },
        { id: 48, name: '2014 - September' },
        { id: 49, name: '2014 - October' },
        { id: 50, name: '2014 - November' },
        { id: 51, name: '2014 - December' },
        { id: 52, name: '2015 - Unsorted' },
        { id: 53, name: '2015 - August' },
        { id: 54, name: '2015 - October' },
        { id: 55, name: '2015 - November' },
        { id: 56, name: '2016 - April' },
        { id: 57, name: '2016 - July' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('51f927737e91c862b2af8033') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Août 2013' },
        { id: 1, name: 'Hexagone' },
        { id: 2, name: 'Heaven' },
        { id: 3, name: 'Indie Dance' },
        { id: 4, name: 'K,PS,PT,etc..Rock' },
        { id: 5, name: 'pop' },
        { id: 6, name: 'Whaaat ???' },
        { id: 7, name: 'Oldies' },
        { id: 8, name: 'Les aïeuls ' },
        { id: 10, name: 'EDM' },
        { id: 11, name: 'NIcolas Henri IV' },
        { id: 12, name: 'Wedding B&C' },
        { id: 13, name: 'Wedding B&C 2' },
        { id: 14, name: "Anniv Ant'" },
        { id: 15, name: 'Noël' },
        { id: 16, name: '2016-05' },
        { id: 17, name: '2016-04' },
        { id: 18, name: '2016-03' },
        { id: 19, name: '2016-02' },
        { id: 20, name: '2016-01' },
        { id: 21, name: 'Chouchou' },
        { id: 22, name: '2015-12' },
        { id: 23, name: '2015-11' },
        { id: 24, name: '2016-07' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('51ffc3167e91c862b2af90ee') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Sweet' },
        { id: 1, name: 'Soul' },
        { id: 2, name: 'PEUWA' },
        { id: 3, name: 'Minimal/Deep/Techno' },
        { id: 4, name: 'Ambient/jaar style' },
        { id: 5, name: 'Dance House rude/Amine&Edge style' },
        { id: 6, name: 'Indé' },
        { id: 7, name: 'Variety Worldwide' },
        { id: 8, name: 'Funk' },
        { id: 9, name: 'Groovity' },
        { id: 10, name: 'JazzyJazzYo' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52371f2e7e91c862b2b02c9d') },
  {
    $set: {
      pl: [{ id: 0, name: 'Good shit' }]
    }
  }
);

db.user.update(
  { _id: ObjectId('52cfd4537e91c862b2b2ab12') },
  {
    $set: {
      pl: [
        { id: 0, name: 'NU & Friends' },
        { id: 1, name: 'The Sound You Need' },
        { id: 2, name: 'Holy Chill' },
        { id: 3, name: 'Délicieuse Musique' },
        { id: 4, name: 'Gesaffelstein' },
        { id: 6, name: 'On And On Records' },
        { id: 7, name: 'Soul Square' },
        { id: 8, name: 'Electro Swing' },
        { id: 9, name: 'Gramatik' },
        { id: 10, name: 'Chinese Man Records' },
        { id: 11, name: 'Griz/matik' },
        { id: 12, name: 'Roche Musique' },
        { id: 13, name: 'ED Banger Records' },
        { id: 14, name: 'Nova Tunes' },
        { id: 15, name: 'Rap Français' },
        { id: 16, name: 'Old School' },
        { id: 17, name: 'Reggea' },
        { id: 18, name: 'French Touch' },
        { id: 20, name: 'UK Electro' },
        { id: 21, name: 'Deep House' },
        { id: 22, name: 'The Geek x Vrv' },
        { id: 24, name: 'Dealer de Musique' },
        { id: 25, name: 'Hôtel Costes' },
        { id: 26, name: "Clem Beat'z" },
        { id: 27, name: 'Muse' },
        { id: 31, name: 'DOPE' },
        { id: 32, name: 'Rap U.S.' },
        { id: 33, name: 'Progressive / Psytrance' },
        { id: 34, name: 'Dark Minimal / Tech House' },
        { id: 35, name: 'Chill Out' },
        { id: 36, name: 'Majestic Casual' },
        { id: 37, name: 'Trip Hop' },
        { id: 38, name: 'Smooth' },
        { id: 39, name: 'New Hip Hop' },
        { id: 40, name: 'ProleteR' },
        { id: 42, name: "Let's Rock !" },
        { id: 43, name: 'Nicolas Jaar' },
        { id: 44, name: 'System Of A Down' },
        { id: 45, name: 'Berlin Calling' },
        { id: 47, name: 'Techno (Berghain)' },
        { id: 48, name: 'Fakear' },
        { id: 49, name: 'Chillwave' },
        { id: 50, name: 'Jazzy Mood' },
        { id: 51, name: 'Maya Jane Coles' },
        { id: 53, name: 'House' },
        { id: 54, name: 'Recondite / Tale of Us' },
        { id: 55, name: 'Apéro' },
        { id: 56, name: 'La Fine Equipe' },
        { id: 57, name: 'URLS' },
        { id: 58, name: 'Guts' },
        { id: 59, name: 'Melodic Techno' },
        { id: 60, name: 'Bar Party' },
        { id: 61, name: 'Gold' },
        { id: 62, name: 'Multicultural/Tribal Electronic' },
        { id: 63, name: 'Deep' },
        { id: 64, name: 'Burning Man' },
        { id: 65, name: 'Deep House Amsterdam' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52d2b4ad7e91c862b2b2e9ce') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Motherfolker #11 - Jump and shout' },
        { id: 1, name: "Motherfolker #10 - I'll be there anytime" },
        { id: 2, name: 'pioche oldies' },
        { id: 3, name: "Motherfolker #12 - Sometimes sorry ain't enough" },
        { id: 4, name: "Motherfolker #13 - When you go you don't look back" },
        { id: 5, name: 'Motherfolker #14bis - Names' },
        { id: 6, name: "Motherfolker #15 - I've been up all night" },
        { id: 7, name: 'Motherfolker #22 - Soundtracks' },
        { id: 8, name: "Motherfolker #16 - Life's getting hard in here" },
        { id: 9, name: 'Motherfolker #17 - If you hate the taste of wine' },
        { id: 10, name: 'Réserve' },
        { id: 11, name: "Motherfolker #18 - There's no time to take" },
        { id: 12, name: 'Motherfolker #20 - Like water rushing over us' },
        { id: 13, name: 'Motherfolker #21 - I never knew a voice like yours' },
        { id: 14, name: 'Motherfolker #23 - And the colour changes fast' },
        { id: 15, name: 'Motherfolker #24 - Every creature casts a shadow' },
        {
          id: 16,
          name: 'Motherfolker #25 - I know life is long but it goes so fast'
        },
        { id: 17, name: "Motherfolker #27 - It's one thing to surprise" },
        { id: 18, name: 'Motherfolker #28 - All You Have To Do Is Wander' },
        { id: 19, name: 'Motherfolker #30 - Leave your vices at the door' },
        { id: 20, name: 'Motherfolker #31 - Throw me a dream please' },
        { id: 21, name: 'Motherfolker #32 - Somewhere to belong' },
        { id: 22, name: "Motherfolker #33 - So what's been on your mind" },
        { id: 23, name: 'Motherfolker #34 - Best Of 2014' },
        { id: 24, name: 'Motherfolker #35 - Should we leave a light on' },
        { id: 25, name: 'Motherfolker #36 - Nothing like it' },
        { id: 27, name: 'Motherfolker #39 [HS] - Balls' },
        { id: 28, name: 'Motherfolker #40 [HS] - Boobs' },
        { id: 29, name: "Motherfolker #41 - Ain't that your thing though" },
        { id: 30, name: 'Motherfolker #19 [HS] - Summertime' },
        { id: 31, name: 'Motherfolker #42 - Filling pages one by one' },
        { id: 32, name: 'Motherfolker #47 [HS] - BestOf 2015' },
        { id: 33, name: "Motherfolker #43 - I'm happy that you came" },
        { id: 34, name: 'Motherfolker #44 - Emerging from the wilderness' },
        {
          id: 35,
          name: 'Motherfolker #45 - Pass the wine, fuck the government'
        },
        { id: 36, name: 'Motherfolker #46 - How much is it all worth' },
        {
          id: 37,
          name: 'Motherfolker #50 - It kept me real til’ I’m moving on'
        },
        { id: 38, name: 'Motherfolker #51 - I only know the recipe to roam' },
        { id: 39, name: 'Motherfolker #52' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52df16957e91c862b2b38b07') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Chill' },
        { id: 1, name: "Rock'n'Roll " },
        { id: 2, name: 'Oldies' },
        { id: 3, name: 'Cool' },
        { id: 4, name: 'Jaar' },
        { id: 5, name: 'FR-FR-FR' },
        { id: 6, name: 'Morcheeba' },
        { id: 7, name: 'PAPOOZ' },
        { id: 8, name: 'FRESH JUICE' },
        { id: 9, name: 'French Rap' },
        { id: 10, name: 'Retro France' },
        { id: 11, name: 'Reggae' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52df9faf7e91c862b2b3a715') },
  {
    $set: {
      pl: [
        { id: 0, name: 'GLITCH-IES & CLEAN' },
        { id: 1, name: 'RAPPY-N’B-HAPPY' },
        { id: 2, name: 'ROCKY-INDIE-POP' },
        { id: 3, name: 'GREAT VIDEOS' },
        { id: 4, name: 'CLASSAZZUES' },
        { id: 5, name: 'FRENCHYCRY' },
        { id: 6, name: 'ENERGYCHILL' },
        { id: 7, name: 'MORNINGSONGZ' },
        { id: 8, name: 'OLDIEGOODIE' },
        { id: 9, name: 'GYMSESSION' },
        { id: 10, name: 'FOCUSONG' },
        { id: 11, name: 'CHIGAROUSE' },
        { id: 12, name: 'B' },
        { id: 13, name: 'C' },
        { id: 14, name: 'S' },
        { id: 15, name: "0'" }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52e511fd7e91c862b2b42400') },
  {
    $set: {
      pl: [
        { id: 0, name: 'A-C' },
        { id: 1, name: 'D-F' },
        { id: 2, name: 'G-K' },
        { id: 3, name: 'L-N' },
        { id: 4, name: 'O-R' },
        { id: 5, name: 'S-U' },
        { id: 6, name: 'V-Z' },
        { id: 7, name: 'Benoît 1' },
        { id: 8, name: 'HB Ben' },
        { id: 9, name: 'Playlist 1 - CZ' },
        { id: 10, name: 'playlist 2 - CZ' },
        { id: 11, name: 'Playlist DiscoDynamite - CZ' },
        { id: 12, name: 'Playlist - BC - 1' },
        { id: 13, name: 'PF - GC' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52efc52b7e91c862b2b4f6ea') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Soooo Smooth #1' },
        { id: 1, name: 'Not So Mainstream' },
        { id: 2, name: 'Faat Bangaz' },
        { id: 4, name: 'Party Jumping' },
        { id: 5, name: 'Sounds Good' },
        { id: 6, name: 'WaitWhat' },
        { id: 7, name: 'Minimalistic#1' },
        { id: 8, name: 'Hip&Hop' },
        { id: 9, name: 'ChillFreshOut' },
        { id: 11, name: 'Chill Chill Chill' },
        { id: 12, name: 'Soft Electro #1' },
        { id: 13, name: 'Do you want some ?' },
        { id: 15, name: 'Wood & Metal #1' },
        { id: 17, name: 'Chill Out #1' },
        { id: 19, name: 'Chill Out #2' },
        { id: 20, name: 'Soooo Smooth #2' },
        { id: 22, name: 'Chill Out #3' },
        { id: 23, name: 'Soft Electro #2' },
        { id: 24, name: 'MIX #1' },
        { id: 25, name: 'Chill Out #4' },
        { id: 26, name: 'Jump Around #1' },
        { id: 27, name: 'Chill Out #5' },
        { id: 29, name: 'Soft Electro #3' },
        { id: 30, name: 'Chill Out #6' },
        { id: 31, name: 'Chill Out #7' },
        { id: 32, name: 'Wood & Metal #2' },
        { id: 33, name: 'Chill Out #8' },
        { id: 34, name: 'Soft Electro #4' },
        { id: 35, name: 'Chill Out #9' },
        { id: 36, name: 'SummerWinterDub' },
        { id: 37, name: 'Minimalistic#2' },
        { id: 38, name: 'Chill Out #10' },
        { id: 39, name: 'WarmUp #1' },
        { id: 40, name: 'Soft Electro #5' },
        { id: 41, name: 'Chill Out #11' },
        { id: 42, name: 'Chill Mix' },
        { id: 43, name: 'Soft Electro #6' },
        { id: 44, name: 'Latin' },
        { id: 45, name: 'Chill Out #12' },
        { id: 46, name: 'So Smooth #3' },
        { id: 47, name: 'So Smooth #4' },
        { id: 48, name: 'Chill Out #13' },
        { id: 49, name: 'Chill Out #14' },
        { id: 50, name: 'So Smooth #5' },
        { id: 51, name: 'Vinyl OST' },
        { id: 52, name: 'Skank In The Air' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('52f906637e91c862b2b54537') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Lernmusik' },
        { id: 1, name: 'Optimus Alive 2014' },
        { id: 2, name: 'Creepy Halloween' },
        { id: 3, name: 'Kein Liebeslied' },
        { id: 4, name: 'Läuft bei euch: Songs zum Joggen' },
        { id: 5, name: 'Blutmond (und Weltuntergang) 2015' },
        { id: 6, name: 'Ze Germans' },
        { id: 7, name: 'Weihnachten My Ass' },
        { id: 8, name: 'お食事をお楽しみ下さい: Eine Playlist für Sushi' },
        { id: 9, name: 'Bon Appétit: Eine Playlist für Quiche' },
        { id: 10, name: '¡Buen provecho!: Eine Playlist für Burritos' },
        { id: 11, name: ' Καλή σας όρεξη: Eine Playlist für Souvlaki' },
        { id: 12, name: 'Buon appetito: Eine Playlist für Pasta' },
        { id: 13, name: 'Der große Frühjahrsputz' },
        { id: 14, name: 'Playlist fürs Blutspenden' },
        { id: 15, name: 'Auf der Welle' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('536e778b71eaec19b5715286') },
  {
    $set: {
      pl: [
        { id: 0, name: 'B@ck t° D€c€mb€R' },
        { id: 1, name: 'TiM3 2 4giVe d@ Wint€R' },
        { id: 2, name: 'DJ SET' },
        { id: 3, name: 'May we kiss again' },
        { id: 4, name: 'Irish Coffee' },
        { id: 5, name: 'DJ SET BIS BOUTIQUE' },
        { id: 6, name: 'Na$hville' },
        { id: 7, name: 'PARTY' },
        { id: 8, name: 'KONG KEN // Music for Cars' },
        { id: 9, name: 'Broken Art Club' },
        { id: 10, name: 'ELECTRO2000' },
        { id: 11, name: 'RCP' },
        { id: 12, name: 'BAC chante la France' },
        { id: 13, name: '$UN$ET BOULEVARD' },
        { id: 14, name: 'KONG KEN // FUNKY $PUNK' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('53994fba66491c17b2ad7152') },
  {
    $set: {
      pl: [
        { id: 0, name: 'IMC #July 2014' },
        { id: 1, name: 'IMC #June 2014' },
        { id: 2, name: 'IMC #August 2014' },
        { id: 3, name: 'IMC #September 2014' },
        { id: 4, name: 'IMC #October 2014' },
        { id: 5, name: 'IMC #November 2014' },
        { id: 6, name: 'IMC #December 2014' },
        {
          id: 7,
          name: 'January 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 8,
          name: 'February 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 9,
          name: 'March 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 10,
          name: 'April 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 11,
          name: 'May 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 12,
          name: 'June 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 13,
          name: 'July 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 14,
          name: 'August 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 15,
          name: 'September 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 16,
          name: 'October 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 17,
          name: 'November 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 18,
          name: 'December 2015 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 19,
          name: 'January 2016 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        { id: 20, name: 'French ☆ Indie Pop' },
        {
          id: 21,
          name: 'February 2016 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        {
          id: 22,
          name: 'March 2016 ● Indie Pop ● Indie Rock ● Folk ● Electronic'
        },
        { id: 23, name: 'April 2016 ●Indie Pop ●Indie Rock ●Folk ●Electronic' },
        { id: 24, name: 'May 2016 ●Indie Pop ●Indie Rock ●Folk ●Electronic' },
        {
          id: 25,
          name: 'Nouvelle Scène ☆ French Pop ● French Rock ● Folk ● Electronic'
        },
        { id: 26, name: 'June 2016 ●Indie Pop ●Indie Rock ●Folk ●Electronic' },
        { id: 27, name: 'July 2016 ●Indie Pop ●Indie Rock ●Folk ●Electronic' },
        { id: 28, name: 'Pop Rock ☆ 2016' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('53a30b5466491c17b2ad98e1') },
  {
    $set: {
      pl: [
        { id: 0, name: 'NEWS from WHYD' },
        { id: 1, name: 'PSY-MINIMAL' },
        { id: 2, name: 'MORNING' },
        { id: 3, name: 'HIP RAP POP' },
        { id: 4, name: 'CRAZY STRANGE UNIQUE' },
        { id: 5, name: 'JUNGLA' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('53aed1db66491c17b2ae9c40') },
  {
    $set: {
      pl: [
        { id: 0, name: 'hc' },
        { id: 2, name: 'ct' },
        { id: 5, name: 'noir' },
        { id: 6, name: 'noir' },
        { id: 7, name: 'scodi' },
        { id: 8, name: 'alltimefav' },
        { id: 9, name: 'rootsi' },
        { id: 10, name: '90sjewels' },
        { id: 11, name: 'aesthe' },
        { id: 12, name: 'XR6' },
        { id: 13, name: 'bondodoça' },
        { id: 14, name: 'Envoutee' },
        { id: 15, name: 'bdy' },
        { id: 16, name: 'faz' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('54320e9ae04b7b4fca7f8c66') },
  {
    $set: {
      pl: [
        { id: 1, name: 'Popcorn Culture' },
        { id: 2, name: 'Sugar' },
        { id: 3, name: 'Avicii' },
        { id: 4, name: 'Example' },
        { id: 5, name: 'Guess I got Swagg' },
        { id: 6, name: 'Excision' },
        { id: 7, name: 'Netsky' },
        { id: 8, name: 'Rusko' },
        { id: 9, name: 'Zomboy' },
        { id: 10, name: "Zed's Dead" },
        { id: 11, name: 'Omar LinX' },
        { id: 12, name: 'Slim Shady' },
        { id: 13, name: 'LA THE dARKMAN' },
        { id: 14, name: 'Queen Bees' },
        { id: 15, name: 'House of Pain' },
        { id: 16, name: 'Funkdoobiest' },
        { id: 17, name: 'Infected Dubstep Host' },
        { id: 18, name: 'Milo & Otis' },
        { id: 19, name: 'Dubba Johnny' },
        { id: 20, name: '86-96 The Game Went From Sugar To Shit' },
        { id: 21, name: 'Before 50 Cent Sucked' },
        { id: 22, name: 'Poison' },
        { id: 23, name: 'The Gift' },
        { id: 24, name: 'Infected Mushroom' },
        { id: 25, name: 'Hip Hop Intel' },
        { id: 26, name: 'Bastille' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('54fb2edd7d50a7417677ffc4') },
  {
    $set: {
      pl: [
        { id: 0, name: 'El sonido del ritmo' },
        { id: 1, name: 'tranquillo' },
        { id: 2, name: 'Au crépuscule' },
        { id: 3, name: 'Pepita' },
        { id: 4, name: 'Pensive' },
        { id: 5, name: 'Coton' },
        { id: 6, name: 'Oh joie' },
        { id: 7, name: "c'est kitsch and I love it" },
        { id: 8, name: 'ffilps a ekat' },
        { id: 9, name: "Rave dans l'salon" }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('552994137d50a7417678b219') },
  {
    $set: {
      pl: [{ id: 0, name: 'The Good ones :P ' }]
    }
  }
);

db.user.update(
  { _id: ObjectId('5580ca9d4bf212908fb368ca') },
  {
    $set: {
      pl: [
        { id: 0, name: 'gosu' },
        { id: 1, name: 'C' },
        { id: 2, name: 'NCS' },
        { id: 3, name: 'Mix' },
        { id: 4, name: 'VLOG' },
        { id: 5, name: 'Heartwarming' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('55ce22554bf212908fb464cb') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Août' },
        { id: 1, name: 'Dub Booty Booty shake dans ton salon' },
        { id: 2, name: 'Zen' },
        { id: 3, name: 'Rock Psyché/Garage' },
        { id: 4, name: 'Sweet ' },
        { id: 5, name: 'Jazz/Soul/Down beat' },
        { id: 6, name: 'Rap U.S.' },
        { id: 7, name: '- Peace Time - ' },
        { id: 8, name: 'Vidéo' },
        { id: 9, name: 'Rap français' },
        { id: 10, name: 'Techno - Minimale - Trance' },
        { id: 12, name: 'Trip-hop / Abstract beat' },
        { id: 13, name: 'Rock & Sixties' },
        { id: 14, name: 'Génie' },
        { id: 15, name: 'Coffee, jam & sound' },
        { id: 16, name: 'Live' },
        { id: 17, name: 'Bonne nuit les petits' },
        { id: 18, name: 'Cumbia!' },
        { id: 19, name: 'Blues / Funk' },
        { id: 20, name: 'New Rock / Rock progressif' },
        { id: 21, name: 'Tribal Ethnic' },
        { id: 22, name: 'Ambient / Abstract / Experimental' },
        { id: 23, name: 'Reggae Gaie Gueh' },
        { id: 24, name: "La France aussi c'est chouette" },
        { id: 25, name: 'veuillez sortir de mon corps svp' },
        { id: 26, name: 'Incontournables' },
        { id: 27, name: "Chez moi, c'est Versailles" },
        { id: 28, name: 'Searching for the perfect bass' },
        { id: 29, name: 'Hip-Hip-Hop-HIO-HIE' },
        { id: 30, name: 'Ça ravigotte !' },
        { id: 31, name: 'Des éléphants roses dans le ciel' },
        { id: 32, name: 'Pêle mêle etivohivernal' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('56164b4e4bf212908fb5210e') },
  {
    $set: {
      pl: [
        { id: 0, name: 'CHILL.' },
        { id: 1, name: 'PETITE.' },
        { id: 2, name: 'REMEMBER.' },
        { id: 3, name: "ABSTRACK'GRAM RADIO" },
        { id: 4, name: 'DEFTEK.' },
        { id: 5, name: 'PLASMA.' },
        { id: 6, name: 'LIGHT.' },
        { id: 7, name: 'OPA.' },
        { id: 8, name: 'CORSE.' },
        { id: 9, name: 'CORE' },
        { id: 10, name: "ROCK'BABE" },
        { id: 11, name: 'TEEN SPIRIT' },
        { id: 12, name: 'BLANK GENERATION RADIO' },
        { id: 13, name: 'FEEL GOOD' },
        { id: 14, name: 'ROAD.' },
        { id: 15, name: 'ABSTRACK' },
        { id: 16, name: 'UNDER WATER.' },
        { id: 17, name: 'NANTES MON AMOUR.' },
        { id: 18, name: 'CULT.' },
        { id: 19, name: 'PUTAIN.' },
        { id: 20, name: 'STUP.' },
        { id: 21, name: 'GROV.' },
        { id: 22, name: 'SUNSET.' },
        { id: 23, name: 'WAKE UP. ' },
        { id: 24, name: 'THRILL.' },
        { id: 25, name: 'STONER' },
        { id: 26, name: 'BLACK.' },
        { id: 27, name: 'WHITE.' },
        { id: 28, name: 'LOVE.' },
        { id: 29, name: 'ESCAPE.' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('564501ac4bf212908fb5acae') },
  {
    $set: {
      pl: [
        {
          id: 0,
          name: "(C'est pas de la) TRAP (mais le son est lourd quand même!!!)"
        },
        { id: 1, name: 'Trance / Psy-Trance / Goa ' },
        { id: 2, name: 'Underground / Deep House' },
        { id: 3, name: 'House / Tech-House' },
        { id: 4, name: 'Reggae / Raggatek / Dubstep / Drum&Bass..' },
        { id: 5, name: 'Hip Hop / Rap' },
        { id: 6, name: 'Italo / Nu / Deviant Disco' },
        { id: 7, name: 'Deep / Acid / Techno' },
        { id: 9, name: 'Chill Sympathique' },
        { id: 10, name: 'Indie Electronic & Minimal' },
        { id: 11, name: 'Beat / Futur Beat / Chill Trap / Downtempo' },
        { id: 12, name: "Dour Mon Amour '16" },
        { id: 13, name: 'Disco, Funk & Soul ' },
        { id: 15, name: 'Overdrive Infinity' },
        { id: 16, name: "Thibz's Dancing Shoes" },
        { id: 18, name: 'Jazz, Afro, Arab & Americana' },
        { id: 19, name: 'Bass, Grime & UK Garage' },
        { id: 20, name: 'The Marvellous Sixties and Seventies' },
        { id: 22, name: 'Macki Music Festival' },
        { id: 23, name: 'Peacock Society 2016' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('568e5ee44bf212908fb66a20') },
  {
    $set: {
      pl: [
        { id: 0, name: 'ALLOISE' },
        { id: 1, name: 'FEDER' },
        { id: 2, name: 'Tiësto' },
        { id: 3, name: 'PLAYMEN' },
        { id: 4, name: 'Lana Del Rey' },
        { id: 5, name: 'Muttonheads' },
        { id: 6, name: 'AronChupa' },
        { id: 7, name: 'Robin Schulz' },
        { id: 8, name: 'Deorro x Chris Brown' },
        { id: 9, name: 'Calvin Harris' },
        { id: 10, name: 'Kygo' },
        { id: 11, name: 'OMI' },
        { id: 12, name: 'KADEBOSTANY' },
        { id: 13, name: 'LMFAO' },
        { id: 14, name: 'Adam Lambert' },
        { id: 15, name: 'Galantis' },
        { id: 16, name: 'Avicii' },
        { id: 17, name: 'Calvin Harris & Disciples' },
        { id: 18, name: 'Mr. Probz' },
        { id: 19, name: 'Armin van Buuren' },
        { id: 20, name: 'Dimitri Vegas & Like Mike' },
        { id: 21, name: 'The Avener, Phoebe Killdeer' },
        { id: 22, name: 'Sigma & Rita Ora' },
        { id: 23, name: 'Lost Frequencies' },
        { id: 24, name: 'David Guetta' },
        { id: 26, name: 'Axwell /\\ Ingrosso' },
        { id: 27, name: 'Jason Derulo' },
        { id: 28, name: 'ZHU x AlunaGeorge' },
        { id: 29, name: 'Felix Jaehn' },
        { id: 30, name: '99 Souls' },
        { id: 31, name: 'Martin Solveig' },
        { id: 32, name: 'Gorgon City' },
        { id: 33, name: 'Alice Deejay' },
        { id: 34, name: 'Coldplay' },
        { id: 35, name: 'Rihanna' },
        { id: 36, name: 'Lilly Wood & The Prick and Robin Schulz' },
        { id: 37, name: 'Swedish House Mafia' },
        { id: 38, name: 'Martin Solveig & GTA' },
        { id: 39, name: 'Daft Punk' },
        { id: 40, name: 'SCOOTER' },
        { id: 41, name: 'SASH!' },
        { id: 42, name: 'Martin Garrix' },
        { id: 43, name: 'The Avener' },
        { id: 44, name: 'Showtek & Justin Prime' },
        { id: 45, name: 'Bakermat' },
        { id: 46, name: 'Icona Pop' },
        { id: 47, name: 'Michael Gray' },
        { id: 48, name: 'Gwen Stefani' },
        { id: 49, name: 'Dawin' },
        { id: 50, name: 'Spada' },
        { id: 51, name: 'Goldfrapp' },
        { id: 52, name: 'Bobina' },
        { id: 53, name: 'Kiesza' },
        { id: 54, name: 'AZEALIA BANKS' },
        { id: 55, name: 'Morandi' },
        { id: 56, name: 'Timmy Trumpet & Savage' },
        { id: 57, name: 'Adele' },
        { id: 58, name: 'Fly Project' },
        { id: 59, name: 'MC Hammer' },
        { id: 60, name: 'Coldplay' },
        { id: 61, name: 'Katrin, DJ Cross' },
        { id: 62, name: 'Sunrise Avenue' },
        { id: 63, name: 'Stage Rockers' },
        { id: 64, name: 'Haddaway' },
        { id: 65, name: 'Imany' },
        { id: 66, name: 'The Cranberries' },
        { id: 67, name: 'Bob Sinclar' },
        { id: 68, name: 'Beyoncé' },
        { id: 69, name: 'KATO' },
        { id: 70, name: 'Fifth Harmony' },
        { id: 71, name: 'Fatboy Slim' },
        { id: 72, name: 'Pep & Rash' },
        { id: 73, name: 'CHESTER PAGE' },
        { id: 74, name: 'Selena Gomez' },
        { id: 75, name: 'Drake' },
        { id: 76, name: 'Sting' },
        { id: 77, name: 'Parachute Youth' },
        { id: 78, name: 'David Guetta & Showtek' },
        { id: 79, name: 'Chris Brown' },
        { id: 80, name: 'Iyeoka' },
        { id: 81, name: 'Dada Life' },
        { id: 82, name: 'Moby' },
        { id: 83, name: 'Oliver Heldens & Shaun Frank' },
        { id: 84, name: 'Madison Avenue' },
        { id: 85, name: 'Katy Perry' },
        { id: 86, name: 'Eric Prydz VS Pink Floyd' },
        { id: 87, name: 'Eva Simons' },
        { id: 88, name: 'Stromae' },
        { id: 89, name: 'R. City' },
        { id: 90, name: 'Tinie Tempah' },
        { id: 91, name: 'Coolio' },
        { id: 92, name: 'DEV' },
        { id: 93, name: 'Naughty Boy' },
        { id: 94, name: 'Nico & Vinz' },
        { id: 95, name: 'Blank & Jones' },
        { id: 96, name: 'Dan Balan' },
        { id: 97, name: 'The Black Eyed Peas' },
        { id: 98, name: 'Three Days Grace' },
        { id: 99, name: 'Evanescence' },
        { id: 100, name: 'Within Temptation' },
        { id: 101, name: 'DNCE' },
        { id: 102, name: 'KDA' },
        { id: 103, name: 'Betoko' },
        { id: 104, name: 'Lykke Li' },
        { id: 105, name: 'Martin Garrix & MOTi' },
        { id: 106, name: 'Hurts' },
        { id: 107, name: 'Kaskade' },
        { id: 108, name: 'Avicii vs Nicky Romero' },
        { id: 109, name: 'Robin Thicke' },
        { id: 110, name: 'DJ Snake, AlunaGeorge' },
        { id: 111, name: 'Chris Brown & Benny Benassi' },
        { id: 112, name: 'Duck Sauce' },
        { id: 113, name: 'DJ Snake, Lil Jon' },
        { id: 114, name: 'Madcon' },
        { id: 115, name: 'Maroon 5' },
        { id: 116, name: 'Faithless' },
        { id: 117, name: 'Klangkarussell' },
        { id: 118, name: 'Depeche Mode' },
        { id: 119, name: 'Christina Perri' },
        { id: 120, name: 'MACKLEMORE & RYAN LEWIS' },
        { id: 121, name: 'Deorro' },
        { id: 122, name: 'Skrillex' },
        { id: 123, name: 'Global Deejays' },
        { id: 124, name: 'Whizzkidz' },
        { id: 125, name: 'Green Day' },
        { id: 126, name: 'Bodyrockers' },
        { id: 127, name: 'will.i.am' },
        { id: 128, name: 'Maître Gims' },
        { id: 129, name: 'Mia Martina' },
        { id: 130, name: 'Dr. Alban' },
        { id: 131, name: 'De Javu' },
        { id: 132, name: 'Pendulum' },
        { id: 133, name: 'Junior Caldera' },
        { id: 134, name: 'Anna Naklab' },
        { id: 135, name: 'Royksopp, Dj Antonio' },
        { id: 136, name: 'Eminem' },
        { id: 137, name: 'Akon' },
        { id: 138, name: 'INNA' },
        { id: 139, name: 'Safri Duo' },
        { id: 140, name: 'Calvin Harris & Alesso' },
        { id: 141, name: 'Flo Rida' },
        { id: 142, name: 'Afrojack' },
        { id: 143, name: 'Miley Cyrus' },
        { id: 144, name: 'Philip George' },
        { id: 145, name: 'Cris Cab' },
        { id: 146, name: 'Usher' },
        { id: 147, name: 'Shakira' },
        { id: 148, name: 'Zedd' },
        { id: 149, name: 'Prata Vetra' },
        { id: 150, name: 'WILLY WILLIAM' },
        { id: 151, name: 'ZHU' },
        { id: 152, name: 'P!nk' },
        { id: 153, name: 'Stereolizza' },
        { id: 154, name: 'Nelly Furtado' },
        { id: 155, name: 'Lana Del Rey vs Cedric Gervais' },
        { id: 156, name: 'Norman Doray' },
        { id: 157, name: 'Mark Ronson' },
        { id: 158, name: 'Ariana Grande' },
        { id: 159, name: 'Alex C.' },
        { id: 160, name: 'Nebenraum' },
        { id: 161, name: 'YarosLOVE' },
        { id: 162, name: 'SMASH' },
        { id: 163, name: 'Edward Maya & Vika Jigulina' },
        { id: 164, name: 'Gym Class Heroes' },
        { id: 165, name: 'THE HARDKISS' },
        { id: 166, name: 'Dj Aligator' },
        { id: 167, name: 'Medina' },
        { id: 169, name: 'Bellini' },
        { id: 170, name: 'Timo Maas' },
        { id: 171, name: 'Iggy Azalea' },
        { id: 172, name: 'Omnia' },
        { id: 173, name: 'Ariana Grande, The Weeknd' },
        { id: 174, name: 'Tacabro' },
        { id: 175, name: 'ONUKA' },
        { id: 176, name: 'Rudimental' },
        { id: 177, name: 'Pitbull' },
        { id: 178, name: 'Phil H.' },
        { id: 179, name: 'Broken Back' },
        { id: 180, name: 'Sam Hunt' },
        { id: 181, name: 'Clean Bandit' },
        { id: 182, name: 'Blonde' },
        { id: 183, name: 'Taylor Swift' },
        { id: 184, name: 'Major Lazer & DJ Snake' },
        { id: 185, name: 'Sam Feldt' },
        { id: 186, name: 'Riton' },
        { id: 187, name: 'Benny Benassi' },
        { id: 188, name: 'Sia' },
        { id: 189, name: 'Alesso' },
        { id: 190, name: 'Meghan Trainor' },
        { id: 191, name: 'ALEXANDRA STAN' },
        { id: 192, name: 'Sak Noel' },
        { id: 193, name: 'Jennifer Lopez' },
        { id: 194, name: 'WANKELMUT & EMMA LOUISE' },
        { id: 195, name: 'Hozier' },
        { id: 196, name: 'Years & Years' },
        { id: 197, name: 'Duke Dumont' },
        { id: 198, name: 'Kwabs' },
        { id: 199, name: 'Wiz Khalifa' },
        { id: 200, name: 'Sam Smith' },
        { id: 201, name: 'Rock Mafia' },
        { id: 202, name: 'Yogi' },
        { id: 203, name: 'La Bouche' },
        { id: 204, name: 'DJane HouseKat' },
        { id: 205, name: 'Eddy Wata' },
        { id: 206, name: 'Jetta' },
        { id: 207, name: 'Everything But The Girl' },
        { id: 208, name: 'TWO' },
        { id: 209, name: 'Laurent Wolf' },
        { id: 210, name: 'Burak Yeter' },
        { id: 211, name: 'Alex Hepburn' },
        { id: 212, name: 'Far East Movement' },
        { id: 213, name: 'Remady & Manu-L' },
        { id: 214, name: 'Zara Larsson' },
        { id: 215, name: 'Kylie Minogue' },
        { id: 216, name: 'Massari' },
        { id: 217, name: 'Shaun Baker' },
        { id: 218, name: 'Tom Novy' },
        { id: 219, name: 'Ke$ha' },
        { id: 220, name: 'Enrique Iglesias' },
        { id: 221, name: 'Imagine Dragons' },
        { id: 222, name: 'Indila' },
        { id: 223, name: 'Paradisio' },
        { id: 224, name: 'M.I.A.' },
        { id: 225, name: 'C-BooL' },
        { id: 226, name: 'Groove Armada' },
        { id: 227, name: 'Yann Tiersen' },
        { id: 228, name: 'System Of A Down' },
        { id: 229, name: 'Karmin' },
        { id: 230, name: 'Oceana' },
        { id: 231, name: 'Bruno Mars' },
        { id: 232, name: 'John Mamann' },
        { id: 233, name: 'James Blunt' },
        { id: 234, name: 'Yall' },
        { id: 235, name: 'Panzer Flower' },
        { id: 236, name: 'Mahmut Orhan' },
        { id: 237, name: 'Shaggy Mohombi Faydee Costi' },
        { id: 238, name: 'Arash' },
        { id: 239, name: 'GORCHITZA' },
        { id: 240, name: 'Ian Carey' },
        { id: 241, name: 'Ne-Yo' },
        { id: 242, name: 'Late Night Alumni' },
        { id: 243, name: 'Robbie Williams' },
        { id: 244, name: 'Michael Jackson' },
        { id: 245, name: 'Leona Lewis' },
        { id: 246, name: 'The Prodigy' },
        { id: 247, name: 'AWOLNATION' },
        { id: 248, name: 'Mind Vortex' },
        { id: 249, name: 'The Chainsmokers' },
        { id: 250, name: 'Tungevaag & Raaban' },
        { id: 251, name: 'Tom Snare' },
        { id: 252, name: 'Clean Bandit & Jess Glynne' },
        { id: 253, name: 'Encore!' },
        { id: 254, name: 'CVNT5' },
        { id: 255, name: 'Kungs vs Cookin’ on 3 Burners' },
        { id: 256, name: 'Seeb' },
        { id: 257, name: 'Sick Individuals' },
        { id: 258, name: 'DJ Fresh' },
        { id: 259, name: 'The Beloved' },
        { id: 260, name: 'Kukuzenko' },
        { id: 261, name: 'CAZZETTE' },
        { id: 262, name: 'DVBBS & Borgeous' },
        { id: 263, name: "Carla's Dreams" },
        { id: 264, name: 'Mike Posner' },
        { id: 265, name: 'Lucas & Steve' },
        { id: 266, name: 'Dirt Nasty' },
        { id: 267, name: 'Fonzerelli' },
        { id: 268, name: 'Anise K' },
        { id: 269, name: 'Major Lazer' },
        { id: 270, name: 'Delice' },
        { id: 271, name: 'Zara Larsson, MNEK' },
        { id: 272, name: 'Delerium' },
        { id: 273, name: 'Tom Boxer' },
        { id: 274, name: 'Morena' },
        { id: 275, name: 'Justin Timberlake' },
        { id: 276, name: 'Turbotronic' },
        { id: 277, name: 'Disclosure' },
        { id: 278, name: 'Lorde' },
        { id: 279, name: 'Mark Knight & Funkagenda' },
        { id: 280, name: 'EDX' },
        { id: 281, name: 'Havana Brown' },
        { id: 282, name: 'Tough Love' },
        { id: 283, name: 'Digitalism' },
        { id: 284, name: 'OMFG' },
        { id: 285, name: 'Prezioso & Marvin' },
        { id: 286, name: 'DJ BoBo' },
        { id: 287, name: 'Milana' },
        { id: 288, name: 'Slider & Magnit' },
        { id: 289, name: 'ATB' },
        { id: 290, name: 'Paul Van Dyk' },
        { id: 291, name: 'ATC' },
        { id: 292, name: 'Indaqo' },
        { id: 293, name: 'The Parakit' },
        { id: 294, name: 'The Egg' },
        { id: 295, name: 'David Guetta vs. The Egg' },
        { id: 296, name: 'September' },
        { id: 297, name: 'The Knife' },
        { id: 298, name: 'The Cardigans' },
        { id: 299, name: 'Gala' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('5702d49e4bf212908fb78a06') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Bob Marley' },
        { id: 1, name: 'Luc Arbogast' },
        { id: 2, name: 'Jésus ' },
        { id: 3, name: 'Soldat Louis ' },
        { id: 4, name: 'Frero de la Véga' },
        { id: 5, name: 'Louane' },
        { id: 6, name: 'ZAZ' },
        { id: 7, name: 'TRY YANN' },
        { id: 8, name: 'Julie Zenatti' },
        { id: 9, name: 'COLDPLAY ' },
        { id: 10, name: 'ENYA' },
        { id: 11, name: 'Renaud ' },
        { id: 12, name: 'Yves Duteil' },
        { id: 13, name: 'Linda Lemay' },
        { id: 14, name: 'Stromae ' },
        { id: 15, name: 'Dua Lipa ' },
        { id: 16, name: 'Les croquants ' },
        { id: 17, name: 'Michel Polnaref' },
        { id: 18, name: 'Divers ' },
        { id: 19, name: 'Thé Beatles' },
        { id: 20, name: 'Rover' },
        { id: 21, name: 'Pony pony run run' },
        { id: 22, name: 'James BLAKE' },
        { id: 23, name: 'Boulevard des airs ' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('574307c74bf212908fb805cf') },
  {
    $set: {
      pl: [
        { id: 0, name: '- ♛ - ' },
        { id: 1, name: '- Chill - ' },
        { id: 2, name: '- SUMMER - ' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('5743b7e44bf212908fb80765') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Soulache' },
        { id: 1, name: 'Current Explore (Still Updating)' },
        { id: 2, name: 'Step (Still Updating)' },
        { id: 3, name: 'Better Tracks (Still Updating)' },
        { id: 4, name: 'Trap (Bin) (Still Updating) ' },
        { id: 5, name: 'Favorites (Bin) (Still Updating)' },
        { id: 6, name: 'Chill (Bin) (Still Updating)' },
        { id: 7, name: 'Love and Heartache (Bin) (Still Updating)' },
        { id: 8, name: 'House (Bin) (Still Updating)' },
        { id: 9, name: 'Mode Music (Bin) (Still Updating)' },
        { id: 10, name: 'Wave (Bin) (Still Updating)' },
        { id: 11, name: 'Break (Bin) (Still Updating)' },
        { id: 12, name: 'Future (Bin) (Still Updating)' },
        { id: 13, name: 'The Bestest (Bin) (Still Updating)' },
        { id: 14, name: 'Wub & Wobble (Bin) (Still Updating)' },
        { id: 15, name: 'Guitar (Bin) (Still Updating)' },
        { id: 16, name: 'Piano (Bin) (Still Updating)' },
        { id: 17, name: 'Liquid (Bin) (Still Updating)' },
        { id: 18, name: 'Bass (Bin) (Still Updating)' },
        { id: 19, name: 'Poetry (Bin) (Still Updating)' },
        { id: 20, name: 'Downtempo (Bin) (Still Updating)' },
        { id: 21, name: 'Progressive (Bin) (Still Updating)' },
        { id: 22, name: 'Strings (Bin) (Still Updating)' },
        { id: 23, name: 'Dope (Bin) (Still Updating)' },
        { id: 24, name: 'Psy (Bin) (Still Updating)' },
        { id: 25, name: 'Soul (Bin) (Still Updating)' },
        { id: 26, name: 'Jazz (Bin) (Still Updating)' },
        { id: 27, name: 'Ambient (Bin) (Still Updating)' },
        { id: 28, name: 'Euphoria (Bin) (Still Updating)' },
        { id: 29, name: 'Uplifting (Bin) (Still Updating)' },
        { id: 30, name: 'Celtic (Bin) (Still Updating)' },
        { id: 31, name: 'Experimental (Bin) (Stil Updating)' },
        { id: 32, name: 'Trance (Bin) (Still Updating)' },
        { id: 33, name: 'dnb (Bin) (Still Updating)' },
        { id: 34, name: 'Deep (Bin) ' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('574b829a4bf212908fb81770') },
  {
    $set: {
      pl: [
        { id: 0, name: 'Tupac' },
        { id: 1, name: 'Electro Live' },
        { id: 2, name: 'Epic' },
        { id: 3, name: 'Various' },
        { id: 4, name: 'Hanz Zimmer' },
        { id: 5, name: 'Rap Fr' },
        { id: 6, name: 'Summer Feel Good' },
        { id: 7, name: 'Old school' },
        { id: 8, name: 'Movie Soundtrack' },
        { id: 9, name: 'Rock' }
      ]
    }
  }
);

db.user.update(
  { _id: ObjectId('575565674bf212908fb82ab0') },
  {
    $set: {
      pl: [{ id: 0, name: 'June 2016' }, { id: 1, name: 'July 2016' }]
    }
  }
);

db.user.update(
  { _id: ObjectId('577639ab4bf212908fb867f2') },
  {
    $set: {
      pl: [
        { id: 0, name: '01' },
        { id: 1, name: '02' },
        { id: 2, name: '03' },
        { id: 3, name: '04' }
      ]
    }
  }
);
