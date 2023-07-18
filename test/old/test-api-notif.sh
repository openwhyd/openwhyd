# INIT

echo -n -e "\033]0;whyd test\007" # set mac osx's terminal title
cd `dirname "$0"` # make sure to switch to the script's dir (e.g. when launched via mac osx's finder)

URL_PREFIX=http://localhost:8080 # URL_PREFIX=http://openwhyd.org
TEST_USER_EMAIL=apitest@whyd.com
TEST_USER_PWD=coco
TEST_USER_MD5=ac0ddf9e65d57b6a56b2453386cd5db5

UID_ADRIEN=4d94501d1f78ac091dbc9b4d
PLAYLIST_ID=4d94501d1f78ac091dbc9b4d_1

# FUNCTIONS

function ensureUserExists {
	echo Creating user $1 \(if not existing yet on $URL_PREFIX\) ...
	curl --silent --data "ajax=1&name=$1&email=$1&password=$2" $URL_PREFIX/register >/dev/null
}

function loginAndGetCookie {
	echo Logging in to $URL_PREFIX as $1 ...
	COOKIE=`curl --verbose --silent $URL_PREFIX/login?action=login\&ajax=1\&email=$1\&md5=$2 2>&1 >/dev/null | grep Set-Cookie | cut -d' ' -f 3`
	echo Fetching user ...
	USER=`curl --silent --cookie "$COOKIE" $URL_PREFIX/api/user`
	echo -\> COOKIE=$COOKIE
}

function logoutAndClearCookie {
	echo Logging out from $URL_PREFIX ...
	curl --silent $URL_PREFIX/logout 2>&1 >/dev/null
	COOKIE=""
	echo -\> COOKIE=$COOKIE
}

function getLastPostId {
	echo Fetching last post ...
	LAST_PID=`curl --silent --cookie "$COOKIE" $URL_PREFIX/adrien\?format=json\&limit=1 | cut -d "\"" -f 4`
	echo -\> LAST_PID=$LAST_PID
}

function sendPostToWhydUsers {
	echo Sending post $1 to openwhyd users $2 ...
	curl --silent --data "uidList[]=$2" --cookie "$COOKIE" $URL_PREFIX/api/post/$1/sendToUsers >/dev/null
	echo -\> done.
}

function sendPlaylistToWhydUsers {
	echo Sending playlist $1 to openwhyd users $2 ...
	curl --silent --data "action=sendToUsers&plId=$1&uidList[]=$2" --cookie "$COOKIE" $URL_PREFIX/api/playlist >/dev/null
	echo -\> done.
}

# ACTUAL TESTS

ensureUserExists $TEST_USER_EMAIL $TEST_USER_PWD
loginAndGetCookie $TEST_USER_EMAIL $TEST_USER_MD5
getLastPostId
sendPostToWhydUsers $LAST_PID $UID_ADRIEN
sendPlaylistToWhydUsers $PLAYLIST_ID $UID_ADRIEN
logoutAndClearCookie
