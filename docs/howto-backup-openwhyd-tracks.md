# How to backup / download Openwhyd track listings in JSON format

GET parameters for most playlist pages:
- `format`: "`json`" or "`html`" (default)
- `after`: post id (optional)
- `limit`: number of posts to return (default=`20`)

Examples:
- https://openwhyd.org/adrien?format=json returns the last `20` tracks I posted in `JSON` format
- https://openwhyd.org/adrien/playlist/10?format=json&limit=10000 returns the last `10000` tracks I posted in my "electronica" playlist

The `eId` field contains the unique identifier of the track/video on its hosting source. (e.g. youtube/soundcloud/vimeo):
- `/yt/xxx` is a youtube identifier
- `/sc/xxx#http://yyy` is the soundcloud URI of a track, followed by the URL of the audio stream
- `/vi/xxx` is a vimeo identifier

Please use these URLs gently to prevent openwhyd.org from slowing down => add some delay between requests :-)

*exported from https://whyd.hackpad.com/Early-API-Download-Whyd-track-listings-in-JSON-format-CTMZ8XxzRuB*
