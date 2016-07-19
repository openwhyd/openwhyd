# INIT

echo -n -e "\033]0;whyd test\007" # set mac osx's terminal title
cd `dirname "$0"` # make sure to switch to the script's dir (e.g. when launched via mac osx's finder)

URL_PREFIX=http://localhost:8080 # URL_PREFIX=http://whyd.com
TEST_USER_EMAIL=apitest@whyd.com
TEST_USER_PWD=coco
TEST_USER_MD5=ac0ddf9e65d57b6a56b2453386cd5db5

UID_ADRIEN=4d94501d1f78ac091dbc9b4d
PLAYLIST_ID=4d94501d1f78ac091dbc9b4d_1

# TESTING FUNCTIONS

FAIL=0

function fail {
	FAIL=1
	ERROR=$1
}

function check {
	echo
	if [ $FAIL -ne 0 ]; then
		logoutAndClearCookie
		echo
		echo " === TEST FAILED: $ERROR"
		exit 1
	fi
}

function beginTests {
	echo
	echo " === RUNNING TESTS . . ."
	echo
	loginAndGetCookie $TEST_USER_EMAIL $TEST_USER_MD5 $TEST_USER_PWD
	echo
}

function endTests {
	check
	logoutAndClearCookie
	echo
	echo " === ALL TEST PASSED :-)"
	exit 0
}

# COMMON API CALLS

function loginAndGetCookie {
	echo Logging in to $URL_PREFIX as $1 ...
	curl --silent --data "ajax=1&name=$1&email=$1&password=$3" $URL_PREFIX/register >/dev/null # register test user if necessary
	COOKIE=`curl --verbose --silent $URL_PREFIX/login?action=login\&ajax=1\&email=$1\&md5=$2 2>&1 >/dev/null | grep Set-Cookie | cut -d' ' -f 3`
}

function logoutAndClearCookie {
	echo Logging out from $URL_PREFIX ...
	curl --silent $URL_PREFIX/login?action=logout 2>&1 >/dev/null
	COOKIE=""
}

# API CALLS

function extractTrackMetadata { # (eId) -> json
	curl $URL_PREFIX/api/metadataExtractor$1 --cookie "$COOKIE" --silent
}

function extractConciseMetadata { # (eId) -> json
	curl $URL_PREFIX/api/track$1?extract=1 --cookie "$COOKIE" --silent
}

function fetchCachedMetadata { # (eId) -> json
	curl $URL_PREFIX/api/track$1 --cookie "$COOKIE" --silent
}

function tryToFetchCachedMetadata {
	sleep 0.5
	RES=`fetchCachedMetadata $1`
}

function waitForMetadataUpdate { # (eId, t) -> json
	tryToFetchCachedMetadata $1
	# if [[ `echo $RES | jq '.meta,.alt'` == `jq -n 'null,null'` ]];
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
	if [[ `echo $RES | jq '.meta.t'` -le $2 ]]; then tryToFetchCachedMetadata $1; fi
}

function postTrack { # (eId, name) -> pId
	curl $URL_PREFIX/api/post -H "Content-Type: application/json" \
	  --data "{\"action\":\"insert\",\"eId\":\"$1\",\"name\":\"$2\"}" \
	  --cookie "$COOKIE" --silent \
	  | jq ._id | cut -d'"' -f 2 # echo $POST | cut -d'"' -f 24
}

function deletePost { # (pId)
	curl $URL_PREFIX/api/post --data "action=delete&_id=$1" --cookie "$COOKIE" --silent >/dev/null
}

# TEST FUNCTIONS

function testTrack { # (eId, name) -> -1 if the test failed
	echo "Testing with track name: $2 (eId: $1)..."

	# echo "Extracting track metadata ..."
	# FULL=`extractTrackMetadata $1`
	# echo "-> metadata:"
	# echo $FULL | jq '.metadata'
	# echo "-> mappings:"
	# echo $FULL | jq '.mappings | with_entries(del(.value._d))'

	# echo "Extracting concise track metadata ..."
	# CONCISE=`extractConciseMetadata $1`
	# echo "-> metadata: " `echo $CONCISE | jq '.meta'`
	# echo "-> mappings: " `echo $CONCISE | jq '.alt'`

	echo "Fetching cached metadata from the track collection (db) ..."
	BEFORE=`fetchCachedMetadata $1`
	echo "-> metadata: " `echo $BEFORE | jq '.meta'`
	echo "-> mappings: " `echo $BEFORE | jq '.alt'`

	echo "Posting track ..."
	NOW=`curl $URL_PREFIX/now --silent`
	PID=`postTrack "$1" "$2"`

	echo "Fetching cached metadata from the track collection (db) ..."
	waitForMetadataUpdate $1 $NOW
	AFTER=`fetchCachedMetadata $1`
	echo "-> metadata: " `echo $AFTER | jq '.meta'`
	echo "-> mappings: " `echo $AFTER | jq '.alt'`

	if [[ `echo $BEFORE | jq ".alt | length"` -gt `echo $AFTER | jq ".alt | length"` ]]; then
		fail "the number of alternatives is lower after posting the track"; fi

	# if [[ `echo $AFTER | jq ".meta.tit"` == "null" ]]; then
	# 	fail "null track title"; fi

	# if [[ `echo $AFTER | jq ".meta.art"` == "null" ]]; then
	# 	fail "null artist name"; fi

	if [[ `echo $AFTER | jq ".meta.dur"` == "null" ]]; then
		fail "null track duration"; fi

	echo "Deleting post id: $PID ..."
	deletePost $PID
}

# ACTUAL TESTS

beginTests
# --- deezer
testTrack "/dz/62937852" "Man Is Not A Bird - Bringer of Rain and Seed"
check
# --- spotify
testTrack "/sp/63wxaMojZaS69nYttu7Fh1" "Man Is Not A Bird - The sound of spring"
check
testTrack "/sp/1C79CxJdMHjk9RkwX04DRh" "Lady Gaga - Applause"
check
testTrack "/sp/6NmXV4o6bmp704aPGyTVVG" "Kaizers Orchestra - Bøn Fra Helvete (Live)"
check
# --- echonest
testTrack "/en/TRTLKZV12E5AC92E11" "Weezer - El Scorcho"
check
# --- youtube
testTrack "/yt/qrO4YZeyl0I" "Lady Gaga - Bad Romance"
check
testTrack "/yt/ijZRCIrTgQc" "REM - Everybody hurts"
check
# --- soundcloud
testTrack "/sc/johnny_ripper/imaginary-friend#https://api.soundcloud.com/tracks/73035648" "johnny ripper - imaginary-friend"
check
testTrack "/sc/m83/midnight-city" "M83 - Midnight city" #https://api.soundcloud.com/tracks/19087066
check
# --- isrc
# testTrack "/is/FR6V81484643" "Man Is Not A Bird - Bringer of Rain and Seed"
# check
endTests
