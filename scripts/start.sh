#!/bin/bash

ROOT_DIR="`pwd`/.."
PORT="1095"

echo "🌄  Starting Openwhyd with WHYD_PORT=$PORT..."
cd $ROOT_DIR && source env-vars-local.sh && WHYD_PORT=$PORT npx --yes pm2 start app.js
