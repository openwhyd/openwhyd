# Documentation: Track playback log

Rationale: Log every time a track is played (or failed to be played), so that:

- we can detect which tracks (don't) play where (regional restrictions, blocking labels, network problems...)
- we can provide more precise feedback to users, for all different cases of failures
- we can troubleshoot track players (bug fixing)
- we can improve the Deezer fallback

Design constraints:

- This collection will be written very frequently => the writes must be very simple and efficient
- This collection will grow very quickly => the format must be as concise as possible

Proposed list of fields, for each log entry:

- `_id`: ObjectId (automatic, can be used to infer timestamp)
- `eId`: (string) id of the track, without hash suffix (e.g. `/yt/e34tr6`, `/sc/coucou/pouet`)
- `pId`: (string) id of the post
- `uId`: (string) id of the user who played the track
- `own`: (boolean, optional) existing and set to true only if this track being played is one of his own posts
- `err`: (object, optional) player-dependant error structure. may contain an error code and/or message.
- `fbk`: (object, optional) structure provided by the fallback mechanism, in case of error while trying to play the track. may contain the status of connection with Deezer (not connected / connected / premium), a Deezer track id (in case of lookup success), an error code and/or message.
- `ua`: (array of two strings, optional) name and version of the web browser, as detected from user agent.
- `foc`: (boolean, optional) `true` if the openwhyd page was focused / active / in the foreground while playing the track (except for `openwhyd-electron`)

For each played track, the log entry is submitted once:

- Upon reception of the onPlay event => `err` and `fbk` are not set,
- or a track fails playing, but no fallback mechanism is run => only `err` is set,
- or a track fails playing, and the fallback mechanism succeeds => `err` and `fbk` are set
- or a track fails playing, and the fallback mechanism fails too => `err` and `fbk` are set, `fbk` contains some trace of the error

Proposed structure for the `err` field:

- `code`: (integer/string) error code provided by the player (e.g. youtube error code)
- `msg`: (string, optional) error message provided by the player, only if complementary to `code` (e.g. `code` means "not allowed", `msg` contains the name of the blocking label)

Proposed structure for the `fbk` field, when fallback works:

- `eId`: (string) id of the track played as a fallback (e.g. `/dz/76875764764`)
- `dCo`: (boolean, optional) existing and set to true only if user is connected to Deezer
- `dPm`: (boolean, optional) existing and set to true only if user uses Deezer Premium

Proposed structure for the `fbk` field when fallback fails:

- `code`: (integer/string) error code provided by the fallback mechanism
- `msg`: (string, optional) error message provided by the fallback mechanism, only if complementary to `code`

Intended queries:

- `tracklog.find({err: {$exists: true}}); // fetch tracks that failed playing`
- `tracklog.find({err: {$exists: true}, fbk: {$exists: false}}); // failed tracks without fallback`
- `tracklog.find({err: {$exists: true}, fbk: {code: {$exists: true}}}); // tracks + fallback failed`
- ...
- **TBD**

Recommended field index:

- **TBD**, based on intended queries

Proposed future improvements:

- include user agent in log entry when encountering an error

_exported from https://whyd.hackpad.com/Track-performance-log-AF7pRadBNrU_
