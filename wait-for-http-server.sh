#!/bin/bash

# Wait for Openwhyd's app server to be fully running

PORT=$1

until [ "`curl -sL -w "%{http_code}" "localhost:$PORT" -o /dev/null`" -eq 200 ];
do
  >&2 echo "port $PORT does not answer yet. retrying..."
  sleep 1
done

>&2 echo "app is running on port $PORT!"
