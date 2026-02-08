# Openwhyd API

[Openwhyd](https://openwhyd.org) is a free and open-source music curation service that allows users to create playlists of music tracks from various streaming platforms (YouTube, SoundCloud, Vimeo, Deezer...) and to discover the music posted by other users.

[![Openwhyd Demo Video](./img/openwhyd-demo-thumb.png)](https://www.youtube.com/watch?v=aZT8VlTV1YY 'Openwhyd Demo Video')

It's important for us that:

- users can access and download data that they contributed to Openwhyd;
- users can even use their Openwhyd account from 3rd-party software.

In order to satisfy these scenarios, we provide two APIs:

- the [**Data Export API**](#openwhyd-data-export-api) can be used to download the list of tracks of any user profile or playlist posted publicly on Openwhyd;
- the [**User API**](#openwhyd-user-api) can be used to read and update lists of tracks associated to the authenticated user.

## Openwhyd Data Export API

The goal of the Data Export API is to give free access to data that users publicly posted on Openwhyd.

This API can be used by anyone, without authentication, to download:

- a user's public info; (e.g. https://openwhyd.org/adrien/info)
- a user's list of posts; (e.g. https://openwhyd.org/adrien)
- a user's list of playlists (e.g. https://openwhyd.org/adrien/playlists)
- a playlist; (e.g. https://openwhyd.org/adrien/playlist/61)
- or "hot tracks". (e.g. https://openwhyd.org/hot/electro)

The list of tracks can be downloaded in several formats:

- [JSON](https://fr.wikipedia.org/wiki/JavaScript_Object_Notation);
- or as a list of URLs.

Please use these URLs responsibly: add a reasonable delay between requests, in order to not put too much pressure on our server. Thank you!

### GET Parameters

<!-- exported from https://whyd.hackpad.com/Early-API-Download-Whyd-track-listings-in-JSON-format-CTMZ8XxzRuB -->

A list of tracks (or playlists) can be downloaded by appending the following HTTP GET parameters to Openwhyd URLs:

- `format`: "`json`" or "`links`"
- `limit`: number of posts to return (optional, default=`20`)
- `after`: identifier of the post (a.k.a. `pId`) from which entries must be returned (optional, for pagination)
- `callback`: (optional) name of the JavaScript function to which data will be passed as a parameter (for JSONP access from external domains)

### Examples

Examples:

- https://openwhyd.org/adrien?format=json returns the last `20` tracks Adrien posted on his Openwhyd profile, in `JSON` format.
- https://openwhyd.org/adrien/playlist/10?format=links&limit=10000 returns the last `10000` tracks Adrien posted in his "electronica" playlist, as a list of URLs.

### Response format: `links`

If the `links` format was selected, Openwhyd will return a text document with one URL per posted track.

Example:

```
//soundcloud.com/deadoceans/mitski-your-best-american-girl-3#https://api.soundcloud.com/tracks/249475048
//youtube.com/watch?v=If8ChYjdFdE
//alexanderbrandon.bandcamp.com/track/sunrise-on-vanaar
```

These URLs are direct links to the track's content, on their source platform. (e.g. YouTube, SoundCloud, etc...)

URLs are provided without protocol, but can be safely prefixed with `https:`.

### Response format: `json`

If the `json` format was selected, Openwhyd will return a JSON array containing one object per posted track.

Example:

```js
[
  {
    _id: '5c05b9675b1d901f32b6fe4b',
    uId: '4d94501d1f78ac091dbc9b4d',
    uNm: 'Adrien Joly',
    text: '',
    name: 'Mitski - Your Best American Girl',
    eId: '/sc/deadoceans/mitski-your-best-american-girl-3#https://api.soundcloud.com/tracks/249475048',
    img: 'https://i1.sndcdn.com/artworks-000149087394-z2wpob-t500x500.jpg',
    nbP: 6,
    nbR: 1,
    lov: [],
  },
  {
    _id: '5c0561f65b1d901f32b6fdf4',
    uId: '4d94501d1f78ac091dbc9b4d',
    uNm: 'Adrien Joly',
    text: 'merci @[Camille B](user:51483cad7e91c862b2ab6dc2) <3',
    name: 'The Posies, Burn & Shine',
    eId: '/yt/If8ChYjdFdE',
    ctx: 'bk',
    img: 'https://i.ytimg.com/vi/If8ChYjdFdE/default.jpg',
    src: {
      id: 'https://www.youtube.com/watch?v=If8ChYjdFdE',
      name: 'The Posies, Burn &amp; Shine - YouTube',
    },
    nbP: 8,
    lov: [],
  },
];
```

The `eId` property contains the unique identifier of the track/video on its source platform:

- `/yt/xxx` is a YouTube identifier that can be translated to `https://youtube.com/watch?v=xxx`
- `/sc/xxx#http://yyy` is the SoundCloud URI of a track, followed by the URL of its audio stream
- `/vi/xxx` is a Vimeo identifier

You will find a full list of supported source platforms with their identifier prefix in the [Formats](#formats-and-appendix) section of this document.

## Openwhyd User API

The goal of the User API is to allow users to interact with their Openwhyd account from a 3rd-party software.

It can be used to read and update lists of tracks associated to the authenticated user.

In order to allow this, a session must be initiated on Openwhyd's API, by providing the user's email and password. When a session is initiated properly, a cookie will be returned. This cookie will be required for the following API requests. If you want to know more about the authentication flow, read [legacy-login-flow.md](./legacy-login-flow.md).

> Note: an API client for Node.js was written to handle the session-based authentication. It can be installed using [`npm install openwhyd-api-client`](https://www.npmjs.com/package/openwhyd-api-client).

In this section, we will document all the API endpoints supported by Openwhyd.

Table of contents:

- [User session / logging](#user-session--logging)
- [Search](#search)
- [Subscriptions](#subscriptions)
- [Tracks](#tracks)
- [Playlists](#playlists)
- [Upload](#upload)
- [Formats and appendix](#formats-and-appendix)

### User session / logging

#### LOGOUT

`GET /logout` (formerly: `/login?action=logout`)

Clears openwhyd cookie (HTTP headers) and session (database)

Parameters: (GET or POST)

- action=logout
- ajax: (boolean) response will be sent in JSON instead of rendering the form in HTML

Returns:

- HTML login page or form data in JSON (depends of the ajax parameter)

#### FORGOT PASSWORD

`GET /login?action=forgot&email`

Sends a password reset URL to the user by email.

Parameters: (GET or POST)

- action=forgot
- ajax: (boolean) response will be sent in JSON instead of rendering the form in HTML
- email: email address (or username) of the user account

Response: (HTML form or JSON, depends of the ajax parameter)

- ok: (optional) "We just sent you an email to reset your password, wait for it!"
- error: (optional) "Are you sure? We don't recognize your email address!"

#### LOGIN WITH EMAIL

`html : (GET /login?action=login&email&md5)`

Initializes the user session and corresponding cookie, using provided credentials.

Can update the user's Facebook access token in the database, if provided.

Parameters: (GET or POST)

- **action**=login
- **ajax**: (boolean) response will be sent in JSON instead of rendering the form in HTML
- **email**: email address (or username) of the user account
- **md5**: md5-hashed password
- **includeUser**: (boolean, optional) adds `user` object to the ajax response, with following additional fields: `nbLikes`, `nbPosts`, `nbSubscribers` and `nbSubscriptions`

Response: (HTML form or JSON, depends of the ajax parameter)

- **error**: (string, optional) e.g. "Are you sure? We don't recognize your email address!"
- **wrongPassword**: (optional) set to 1 if the password does not match
- **redirect** (optional): URL to redirect the user to, if login succeeded
- **user**: (object, if `includeUser` is set to true): complete db object about the logged in user, containing following additional fields: `nbLikes`, `nbPosts`, `nbSubscribers` and `nbSubscriptions`

#### Register / sign up a new user

This endpoint is called from a sign up form.

If sign up succeeds, the user is logged in similarly to the /login endpoint: a session is set up in DB, and a cookie is returned in the HTTP header of the response.

`POST /register...`

Parameters:

- **name**: (string) full name of the user (accepts spaces)
- **email**: (string) email of the user (for notifications and login)
- **password**: (string) password (to be used for logging in)
- **redirect**: (string, optional) URL to be redirected to, if sign up succeeds
- **ajax**: (string ,optional) set to "true" if response is to be given in JSON format, instead of redirects
- **<s>inviteCode</s>**<s>: (string, deprecated) code given by another user who invited the current visitor to signup. can be the user id of that user. this code was used for validation, when openwhyd was still in closed beta.</s>
- **iBy**: (string, optional) id of the user who invited the visitor to sign up to Openwhyd. the invited visitor will be automatically subscribed to the inviter, and the inviter will be notified upon his friend's sign up.
- **iPg:** (string, optional) URL of the page from which the sign up was initiated (for analytics)
- **iRf**: (string, optional) referrer of the sign up page (origin of the visitor, for analytics)
- **<s>iPo</s>**<s>: (string, deprecated) id of the post from which the visitor was invited => was used to redirect to that post upon successful sign up.</s>

Response: (JSON, _if ajax parameter was set to true_)

- **error**: (string, optional) error message, if any
- **uId**: (string, optional) id of the new user, if sign up succeeded
- **redirect**: (string, optional) URL to redirect to, if sign up succeeded

#### Get user data

GET /api/user

Parameters:

- **id:** (string, optional) id of the user to get info about. logged in user, if not provided.
- **isSubscr**: (boolean, optional) if set to true, the `isSubscribing` attribute will be returned
- **countPosts** (boolean, optional) if set to true and `id` is provided, the `nbPosts` attribute will be returned
- **countLikes** (boolean, optional) if set to true and `id` is provided, the `nbLikes` attribute will be returned
- **includeSubscr**: (boolean, optional) if set to true, `nbSubscribers` and `nbSubscriptions` will be returned

Response: (JSON)

- \_id: user id
- name: full name of the user
- handle: username used to create a custom openwhyd.org/username profile URL
- email: (string)
- bio: (string)
- loc: (string) free text describing the declared location of the user
- img: URL of the avatar
- cvrImg: URL of the cover image (banner of the user profile)
- isSubscribing: (if `isSubscr` set to true) true if the logged in user has subscribed to this user
- nbSubscribers: (if `includeSubscr` set to true) number of subscribers of this user
- nbPosts: (if `countPosts` set to true and `id` provided) number of tracks posted by this user
- nbLikes: (if `countLikes` set to true and `id` provided) number of tracks liked by this user
- nbSubscriptions: (if `includeSubscr` set to true) number of subscriptions of this user
- **lastArtists**: (if `includeTags` set to true) an array of artist names, extracted from the user's last posts
- **twId**: Twitter handle connected to this openwhyd account
- **twTok**: last session token received from connecting to Twitter
- **twSec**: last session secret received from connecting to Twitter
- lastFm: (object)
  - name: username of the user's connected last.fm account
  - sk: session key provided by last.fm (used for last.fm api requests)

- lnk: (object) links to the following websites / social networks of the user (for openwhyd profile):
  - fb: facebook profile
  - igrm: instagram handle
  - sc: soundcloud handle
  - tw: twitter handle
  - yt: youtube handle
  - home: home page

- ~onb: (object) onboarding data~
  - ~tags: (array) list of genre tags (e.g. "Rock") that the user selected~

- pl: (array) list of user's playlist
  - id: number of the playlist (counting from 0 to ...)
  - name: (string)
  - url: (string)
  - nbTracks: (int)

\*frequency is one of these values:

- -1: never
- 0: immediate (don't wait for next digest)
- 1: in a daily digest
- 7: in a weekly digest

#### Set user data

POST /api/user

Updates one or more fields of the logged in user.

Allowed Parameters (one or many can be passed):

- **name:** (string) full user name, to be displayed publicly on Openwhyd
- **img**: (string) user's avatar, must be the url of a file that was just uploaded to openwhyd (**cf upload API**)
- **cvrImg:** (string) user's profile banner, must be the url of a file that was just uploaded to openwhyd (**cf upload API**)
- **pwd:** (string) new password (plain, no md5), `oldPwd` must also be set
- **oldPwd**: (string) old password (plain, no md5), to be provided if intending to change password using `pwd`
- **handle**: (string) user's handle / username / profile custom URL -- will be validated against a list of reserved words
- **email**: (string) user's email address (for openwhyd use only, not displayed publicly)
- **twId**: (string) Twitter handle connected to this openwhyd account (set to empty string to disconnect)
- **twTok**: (string) last session token received from connecting to Twitter (to send with **twId**)
- **twSec**: (string) last session secret received from connecting to Twitter (to send with **twId**)
- **bio**: (string) user's biography / description, to be displayed publicly on Openwhyd
- **loc**: (string) user's location. freeform, no format restrictions apply.
- **lnk_home**: (string) url of user's homepage, to be displayed as is on his profile
- **lnk_fb**: (string) url of user's facebook profile, to be displayed as an icon on his profile
- **lnk_tw**: (string) url of user's twitter profile, to be displayed as an icon on his profile
- **lnk_sc**: (string) url of user's soundcloud profile, to be displayed as an icon on his profile
- **lnk_yt**: (string) url of user's youtube profile, to be displayed as an icon on his profile
- **lnk_igrm**: (string) url of user's instagram profile, to be displayed as an icon on his profile

Response: (JSON)

- **error**: (optional, string) error message
- (or updated user data)

### Search

#### SEARCH TRACKS POSTED BY OTHER USERS

Returns a list of 5 tracks posted by other users, matching the given full-text search query.

This endpoint is used on the "add track" dialog, to incentivize re-posting from other users.

`html : (GET /search?context=addTrack&q=coco)`

Parameters:

- **context=addTrack**
- **q**: (string) full-text search query

Response:

- a JSON array of Post objects: [{id, eId, url, img, name, uId, uNm, score}]

#### SEARCH TRACKS POSTED BY ME + OTHER USERS

Returns a list of tracks posted the logged in user, and by other users, matching the given full-text search query.

This endpoint is used on the experimental openwhyd.org/mobile page, as a compromise between looking up one's own tracks and re-adding from others.

`html : (GET /search?context=quick&q=coco)`

Parameters:

- **context=quick**
- **q**: (string) full-text search query

Response: (JSON hierarchy)

- **q**: (string) search query

#### Combined search page: posts + users + playlists

Returns a list of matching:

- tracks posted by (in the following order):
  - the logged in user
  - followed users
  - other users

- users
- playlists

This endpoint is used for the openwhyd.org/search page.

`html : (GET /search?q=coco)`

Parameters:

- **q**: (string) full-text search query
- **format**: (string, optional) returns JSON data if set to "json", or HTML otherwise

Response: (JSON)

- **q**: (string) search query

### Subscriptions

#### List subscribers of a user

`GET /api/follow/fetchFollowers/<id>`

Parameters:

- **id**: (string) id of the user
- **skip**: (integer, optional) number of subscribers to skip (for paging)
- **limit**: (integer, optional) number of subscribers to return (by default: 50)
- **isSubscr**: (boolean, optional) will fetch and return a `isSubscribing` field for resulting users that are followed by the logged in user

Response: JSON array of objects with the following fields:

- **uId**: id of the subscriber
- **uNm**: name of the subscriber
- **isSubscribing**: (boolean, if the `isSubscr` parameter is set to true) set to true if the subscriber is also followed by the logged in user

#### List subscriptions of a user

`GET /api/follow/fetchFollowing/<id>`

Parameters:

- **id**: (string) id of the user
- **skip**: (integer, optional) number of subscribed users to skip (for paging)
- **limit**: (integer, optional) number of subscribed users to return (by default: 50)
- **isSubscr**: (boolean, optional) will fetch and return a `isSubscribing` field for resulting users that are followed by the logged in user

Response: JSON array of objects with the following fields:

- **tId**: id of the subscribed user
- **tNm**: name of the subscribed user
- **isSubscribing**: (boolean, if the `isSubscr` parameter is set to true) set to true if the subscriber is also followed by the logged in user

#### Get subscription status of a user

Subscribes or unsubscribes to a user. (must be logged in)

`GET /api/follow?action=get&tId`

Parameters:

- **action="get"**
- **tId**: (string) id of the user to get status on

Response: (two cases)

- an empty JSON object if the logged in user has not subscribed to that user
- or a non-empty JSON object otherwise

#### (Un)subscribe to a user

Subscribes or unsubscribes to a user. (must be logged in)

`GET /api/follow?action&tId`

Parameters:

- **action**: (string) "insert" (to subscribe) or "delete" (to unsubscribe)
- **tId**: (string) id of the user to (un)subscribe

Response:

- (a JSON object with an optional **\_id** field => to be ignored)

### TRACKS

#### POST TRACK / Edit a Post

`GET /api/post?action=insert&...`

_Parameters:_

- **action** : ("insert" to insert or edit a track)
- **\_id** : (string, optional) id of the post to edit (if not provided, a new track is added)
- **pId** : (string, optional) id of the post to re-add (if not provided, no existing post is referred to)
- **eId** : (string) openwhyd id of the track embed (ex : "/yt/XdJVWSqb4Ck", see "_syntax of eid identifiers_", below)
- **name** : (string) artist and title of the track
- **text** : (string, optional) comment of the track
- **img :** (string, optional) url of the image representing the track
- **pl:** (object, optional), fields:
  - **id:** (int) number (starting at 0) of the user's playlist in which this track is posted. if set to **"create"**, a new playlist is created.
  - **name:** (string) name of the user's playlist in which this track is posted

- **src** : (object, optional) describes where this track was found. fields:
  - **id: **(string) url of the website/page where the track was found
  - **name: **(string) name of the website/page where the track was found

Result: (JSON)

- **track object**

Examples:

- **/api/post/action=insert&pId=52f4ebe53fe09fa854000043 : **Repost a track
- **/api/post/action=insert&text=your%20comment&eId=/yt/XdJVWSqb4Ck&name=Jack%Johnson%20-%20-Lullaby : **Add a track

#### Delete post

`GET /api/post?action=delete&...`

_Parameters:_

- **action**="delete"
- **\_id** : (string) id of the post to delete

Return:

- **track object**

#### Like / unlike a post

`GET /api/post?action=toggleLovePost&...`

_Parameters:_

- **action**="toggleLovePost"
- **pId** : (string) id of the post to like / unlike

Return:

- **loved**: (boolean) set to true if the post is now liked (or false, otherwise)
- **lovers**: (int) number of user who likes this post
- **post**: (object, optional) post object

#### Likes Tracks by User

[GET /[uId]/likes?format=json](http://openwhyd.org/adrien/likes?format=json)

Parameters:

- **after**: (string, optional) id of the last post of the previous page (for pagination)
- **before**: (string, optional) id of the first post currently

#### Fetch list of users who liked a post

`GET /api/post?action=lovers&...`

_Parameters:_

- **action**="lovers"
- **pId** : (string) id of the post

Return: (JSON)

#### Fetch list of users who re-added a post

`GET /api/post?action=reposts&...`

_Parameters:_

- **action**="reposts"
- **pId** : (string) id of the post

Return: (JSON)

#### Log a play

To be called whenever a track effectively started or failed playing, for analytics and diagnosis.

`GET /api/post?action= incrPlayCounter&...`

_Parameters:_

- **action**="`incrPlayCounter`"
- **pId** : (string) id of the post played
- **logData**: (object, optional), as described in [this spec](https://whyd.hackpad.com/Track-performance-log-AF7pRadBNrU)

#### Scrobble a play to Last.fm

To be called whenever a track ends playing, for users who connected their last.fm account.

`GET /api/post?action= scrobble&...`

_Parameters:_

- **action**="`scrobble`"
- **pId** : (string) id of the post played
- **timestamp**: (long) timestamp of when the track started playing (required by last.fm)
- **trackDuration**: (long, optional) duration of the track, in seconds

Return: (JSON)

- **error**: (string, optional) error message, if any
- ...or last.fm's response object

#### Add a comment to a post

`GET /api/post?action=addComment&...`

_Parameters:_

- **action**="`addComment`"
- **pId** : (string) id of the post to comment
- **text**: (string) text of the comment (may include mentions, cf "syntax of a mention", below)

Return: (JSON)

- **error**: (string, optional) error message, if any
- or the comment object

#### Delete a comment from a post

`GET /api/post?action=deleteComment&...`

_Parameters:_

- **action**="`deleteComment`"
- **\_id** : (string) id of the comment to be deleted

Return: (JSON)

- **error**: (string, optional) error message, if any

#### LIST TRACKS POSTED BY USER

`GET /:uHandle/[playlist/:playlistId]`
`GET /u/:uId/[playlist/:playlistId]`

_Parameters:_

- **format**: "json" or "html" (default)
- **callback**: (string, optional) name of the function name to use for JSONP
- **limit**: (int, optional) number of posts to return
- **after**: (string, optional) id of the last post of the previous page (for pagination)
- **before**: (string, optional) id of the first post currently displayed => will return fresher posts (used to refresh the list of tracks, e.g. when a track was just added)

Return:

- **list of track objects**

Examples:

- [/adrien?format=json](http://openwhyd.org/adrien?format=json) : returns the last 20 tracks I posted in JSON format
- [/u/4d94501d1f78ac091dbc9b4d/playlist/10?format=json](http://openwhyd.org/u/4d94501d1f78ac091dbc9b4d/playlist/10?format=json) : returns the last 20 tracks I posted in JSON format (using user id instead of handle/nickname)
- [/adrien/playlist/10?format=json&limit=10000](http://openwhyd.org/adrien/playlist/10?format=json&limit=10000) : returns the last 10000 tracks I posted in my "electronica" playlist

#### INCOMING STREAM (HOMEPAGE)

`GET /[stream]`

_Parameters:_

- **format**: "json" or "html" (default)
- **limit**: (int, optional) number of posts to return
- **after**: (string, optional) id of the last post of the previous page (for pagination)
- **before**: (string, optional) id of the first post currently displayed => will return fresher posts (used to refresh the list of tracks, e.g. when a track was just added)

Return:

- **list of track objects**

#### HOT TRACKS

`GET /hot`

_Parameters:_

- **format**: "json" or "html" (default)
- **limit**: (int, optional) number of tracks to return
- **skip**: (int, optional) number of hot tracks to skip (for pagination)

Return:

Notes:

- when reposting for the hot tracks page, don't forget to add a `ctx:"hot"` value to the post object, so that this repost will not influence the hot tracks (to prevent too much virality)

#### Detailed track info

`GET /c/[postId]?format=json`

_Parameters:_

- **format**: "json" or "html" (default)

Return:

#### Share a post to Openwhyd users (notification)

`POST /api/post/<pId>/sendToUsers`

User must be logged in => openwhyd session cookie must be included.

_Parameters:_

- **pId:** (string, in the URL path) id of the post to share
- **uidList:** (array of strings) list of IDs of users to share this track with

Return (JSON):

- **ok:** set positive if the request succeeded
- **error:** string or JSON object containing a description of the error

### Playlists

#### Get playlist data

`GET /api/playlist/<id>`

`GET /api/playlist?id=<id1>&id=<id2>`

_Parameters:_

- **id**: complete playlist identifier (format = `<uid>_<playlist_number>`)

Returns: a JSON array of playlists containing the following fields:

- **id**: complete playlist identifier (format = `<uid>_<playlist_number>`)
- **plId**: playlist number (relative to the owning user, according to format given above)
- **uId**: identifier of the user who made that playlist
- **uNm**: name of the user who made that playlist
- **nbTracks**: number of tracks in that playlist

#### Create a playlist

`POST /api/playlist`

Creates a playlist for the logged in user.

NB: it's also possible to create a playlist while posting a track, by providing `(create)` as the value of the `id` field of the `pl` parameter.

_Parameters:_

- **action**: "create"
- **name**: (string) name of the playlist

Returns: (JSON)

- **id**: the id of the newly created playlist (0 being the id of the user's first playlist)
- **name**: the name of the newly created playlist (as provided in the call)

#### Rename a playlist

`POST /api/playlist`

The user who created the provided playlist must be logged in (based on cookie) before using this endpoint

_Parameters:_

- **action**: "rename"
- **id**: (int) number of the playlist (0 being the id of the user's first playlist)
- **name**: (string) new name for this playlist

Returns: (JSON)

- **id**: the id of updated playlist (as provided in the call)
- **name**: the new name of the playlist (also as provided in the call)

#### Delete a playlist

`POST /api/playlist`

Deletes a playlist and moves all the contained tracks in to the user's default profile stream. (tracks will not be part of a playlist anymore)

The user who created the provided playlist must be logged in (based on cookie) before using this endpoint

_Parameters:_

- **action**: "delete"
- **id**: (int) number of the playlist (0 being the id of the user's first playlist)

Returns: (int) the number of the deleted playlist (as provided in the call)

#### Set track order of a playlist

`POST /api/playlist`

This call will set the `order` field of each post contained in the provided playlist from 1 to n, so that the are displayed in the desired order.

The user who created the provided playlist must be logged in (based on cookie) before using this endpoint.

_Parameters:_

- **action**: "setOrder"
- **id**: (int) number of the playlist (0 being the id of the user's first playlist)
- **order**: (array) ordered list of post id

Returns: (JSON)

- **error**: (string, optional) contains an error message, if any... or:
- **ok**: (int) set to 1 if command was successful

#### Update the image of a playlist

`POST /api/playlist`

To be called after the image was uploaded to Openwhyd. Upon success, this uploaded image file will be moved to Openwhyd's playlist images directory.

The user who created the provided playlist must be logged in (based on cookie) before using this endpoint

_Parameters:_

- **action**: "update"
- **id**: (int) number of the playlist (0 being the id of the user's first playlist)
- **img**: (string) path of the uploaded image, in Openwhyd upload directory.

Returns: (JSON)

- **error**: (string, optional) contains an error message, if any... or:
- **id**: the id of updated playlist (as provided in the call)
- **name**: the name of the updated playlist

#### Share a playlist to Openwhyd users (notification)

`POST /api/playlist`

User must be logged in => openwhyd session cookie must be included.

_Parameters:_

- **action:** (string) sendToUsers
- **plId:** (string, in the URL path) id of the playlist to share, format: `<uid>_<playlist-number>`
- **uidList:** (array of strings) list of IDs of users to share this playlist with

Return (JSON):

- **ok:** set positive if the request succeeded
- **error:** string or JSON object containing a description of the error

### Upload

#### Upload a file to Openwhyd's file server

Uploading a file is necessary before changing any image associated (directly or not) to user-generated data (ex: user avatar, user profile banner, playlist cover, etc...). User must be logged in (based on attached cookie).

`POST /upload`

Example of use:

- [](https://github.com/whyd/whyd/blob/master/public/js/dndUpload.js)https://github.com/whyd/whyd/blob/master/public/js/dndUpload.js
- [](https://github.com/whyd/whyd/blob/master/public/js/WhydImgUpload.js)https://github.com/whyd/whyd/blob/master/public/js/WhydImgUpload.js

Parameters:

- **file**: (standard HTML-compliant file upload field)
- **thumbDims**: (string, optional) comma-separated list of dimensions to which the provided image must be resized (e.g. for creating thumbs). Format of a dimension: `[width]x[height]` (both width and height are optional)

Triggers the following standard events:

- `onprogress(event)`: provides `event.loaded` and `event.total` properties
- `onload(event)`: triggered when upload is finished

Response: (JSON)

#### Delete an uploaded file

`POST /upload`

Parameters:

- **action=delete**
- **id**: (string) identifier / filename of the uploaded file to delete from Openwhyd's server

### Formats and Appendix

#### Syntax of "eId" identifiers

The "eId" field contains the unique identifier of the track/video on its hosting source. (e.g. youtube/soundcloud/vimeo):

- `/yt/xxx` is a YouTube identifier (i.e. it translates to `https://youtube.com/watch?v=xxx`)
- `/sc/xxx#http://yyy` is the SoundCloud URI of a track, followed by the URL of its audio stream
- `/bc/xxx#http://yyy` is the BandCamp identifier of a track, followed by the URL of its audio stream
- `/vi/xxx` is a Vimeo track identifier
- `/dz/xxx` is a Deezer track identifier
- `/dm/xxx` is a Dailymotion video identifier
- `/fi/http...` is the URL of a MP3 / audio file

#### Syntax of a mention (in comment text)

sample comment: `blah blah **@[Camille B](user:51483cad7e91c862b2ab6dc2)** blah blah...`

syntax:

- arobase
- user's name, in brackets
- `user:[uId]`, in parenthesis

#### URLs for fetching images

Images can be fetched for any Openwhyd resource (tracks, user, playlists...) from a unified URL scheme, provided the id of this ressource.

The controller will either redirect to the external ressource (e.g. facebook avatars, hosted by facebook) or return the image directly. In the first case, HTTP GET parameters are passed through to the redirect URL.

URL templates:

- **/img/user/<id>**: returns a user's avatar
- **/img/userCover/<id>**: returns a user's profile cover image (banner) or a transparent pixel
- **/img/post/<id>**: returns a track's thumbnail image
- **/img/playlist/<id>**: returns a playlist's image

Specific notes about the playlist template:

- a playlist id has the following syntax: **<user id>\_<playlist number>**
