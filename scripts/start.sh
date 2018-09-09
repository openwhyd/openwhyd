echo "Starting OpenWhyd with WHYD_PORT=$port."
cd whydJS && source env-vars-local.sh && WHYD_PORT=$port npm start &

# Wait for it to be fully running
i=0
while :
do
    echo $i
    sleep 1

    if [ $i -ge $MAX_RETRY ]; then
        echo "App not responding."
        forever stop 1
        echo "Deployment failed."
        exit
    fi

    res="`curl -sL -w "%{http_code}" "localhost:$port" -o /dev/null`"
    if [ $res -eq 200 ]; then
        echo "App up and running."
        break
    fi

    i=$((i+1))
done

# Re-link NGINX configuration (assuming /etc/nginx/conf.d/whyd.conf links to $CURR_DIR/nginx.conf)
sudo unlink $NGINX_ENBLD/openwhyd.org
sudo ln -s $NGINX_AVAIL/openwhyd.org_$port $NGINX_ENBLD/openwhyd.org

# Restart NGINX
sudo service nginx restart

# Finally, Save new port.
if [ $port -eq $PORT_A ]; then
    echo $PORT_B > $CURR_DIR/.port
else
    echo $PORT_A > $CURR_DIR/.port
fi

# Stop old server. Index 0 is always the oldest process.
# forever stop 0
# TODO: only do this if there was an oldest process,
# otherwise it will kill the server it just started!

echo "NGINX restarted. Current app listening on port $port."
echo "Deployment ended."