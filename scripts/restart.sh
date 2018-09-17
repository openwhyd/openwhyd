#!/bin/bash

# Based on https://gist.github.com/Djiit/222205480fd5f6f5eed3f7c0aef33c6a

# Constants
PORT_A=1094
PORT_B=1095
MAX_RETRY=50
ROOT_DIR="`pwd`" # openwhyd's directory
NGINX_AVAIL=/etc/nginx/sites-available
NGINX_ENBLD=/etc/nginx/sites-enabled
NEW_PORT=`cat $ROOT_DIR/.port` || port=$PORT_A

echo "👋  Deployment starting on port $NEW_PORT..."

if [ $NEW_PORT -eq $PORT_A ]; then
    PREV_PORT=$PORT_B
else
    PREV_PORT=$PORT_A
fi

# Start Openwhyd's server
NEW_UID="openwhyd_$NEW_PORT"
PREV_UID="openwhyd_$PREV_PORT"
$ROOT_DIR/scripts/start.sh $NEW_PORT # will start app.js using forever

echo "⏲  Waiting for Openwhyd..."
retries=0
while :
do
    sleep 1
    res="`curl -sL -w "%{http_code}" "localhost:$NEW_PORT" -o /dev/null`"
    if [ $res -eq 200 ]; then
        echo "✅  Openwhyd ($(grep version $ROOT_DIR/package.json)) now listening on port $NEW_PORT."
        break
    fi

    retries=$((retries+1))
    echo "($retries)"

    if [ $retries -ge $MAX_RETRY ]; then
        echo "⚠️  App is not responding. Killing it..."
        $ROOT_DIR/node_modules/.bin/forever stop 0
        # [TODO] Something like this would be better:
        # cd $ROOT_DIR && npm stop -- $NEW_UID
        echo "❌  Deployment failed."
        exit 1
    fi
done

echo "🔧  Applying nginx configuration..."
sudo unlink $NGINX_ENBLD/openwhyd.org
sudo ln -s $NGINX_AVAIL/openwhyd.org_$NEW_PORT $NGINX_ENBLD/openwhyd.org
sudo service nginx restart

echo "🌇  Stopping previous instance of Openwhyd..."
# Stop old server. Index 0 is always the oldest process.
$ROOT_DIR/node_modules/.bin/forever stop 0

# TODO: only do this if there was an oldest process,
# otherwise it will kill the server it just started!
# Something like this would be better:
# cd $ROOT_DIR && npm stop -- $PREV_UID

echo $PREV_PORT > $ROOT_DIR/.port
echo "🗳  Saved next port to $ROOT_DIR/.port."

echo "✨  Deployment ended."
