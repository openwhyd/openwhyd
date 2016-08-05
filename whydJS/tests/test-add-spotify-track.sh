# INIT

echo -n -e "\033]0;whyd test\007" # set mac osx's terminal title
cd `dirname "$0"` # make sure to switch to the script's dir (e.g. when launched via mac osx's finder)

URL_PREFIX=http://localhost:8080 # URL_PREFIX=http://openwhyd.org
TEST_USER_EMAIL=apitest@whyd.com
TEST_USER_PWD=coco
TEST_USER_MD5=ac0ddf9e65d57b6a56b2453386cd5db5

UID_ADRIEN=4d94501d1f78ac091dbc9b4d
PLAYLIST_ID=4d94501d1f78ac091dbc9b4d_1

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

function postTrack { # (eId, name) -> pId
	curl $URL_PREFIX/api/post -H "Content-Type: application/json" \
	  --data "{\"action\":\"insert\",\"eId\":\"$1\",\"name\":\"$2\"}" \
	  --cookie "$COOKIE" --silent \
	  | jq ._id | cut -d'"' -f 2 # echo $POST | cut -d'"' -f 24
}

# ACTUAL TESTS

echo
echo " === RUNNING TESTS . . ."
echo
loginAndGetCookie $TEST_USER_EMAIL $TEST_USER_MD5 $TEST_USER_PWD
echo
echo "Posting track ..."
postTrack "/sp/63wxaMojZaS69nYttu7Fh1" "Man Is Not A Bird - The sound of spring"
# testTrack "/sp/1C79CxJdMHjk9RkwX04DRh" "Lady Gaga - Applause"
# testTrack "/sp/6NmXV4o6bmp704aPGyTVVG" "Kaizers Orchestra - Bøn Fra Helvete (Live)"
echo
logoutAndClearCookie
echo
echo " === ALL TEST PASSED :-)"
exit 0
