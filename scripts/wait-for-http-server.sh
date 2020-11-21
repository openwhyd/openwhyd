#!/bin/bash

# Wait for Openwhyd's app server to be fully running

PORT=$1

>&2 echo "waiting for openwhyd to respond on port $PORT..."

npx wait-on http://localhost:$PORT

>&2 echo "app is running on port $PORT!"
