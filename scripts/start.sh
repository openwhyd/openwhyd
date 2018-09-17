#!/bin/bash

ROOT_DIR="`pwd`" # openwhyd's directory
PORT="$1"

if [ -z "$PORT" ]
then
  echo "usage: start.sh <PORT>"
  echo "e.g. : start.sh 1094"
  exit 1
fi

# Start new server
echo "🌄  Starting Openwhyd with WHYD_PORT=$PORT..."
cd $ROOT_DIR && source env-vars-local.sh && WHYD_PORT=$PORT npm start &

# TODO: find a way to identify that instance, e.g. -- "--uid openwhyd_$PORT"
