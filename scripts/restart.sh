#!/bin/bash

# Constants
ROOT_DIR="`pwd`/.."
PORT="1095"
VERSION=$(node -p "require('$ROOT_DIR/package.json').version")

# NGINX_ENBLD=/etc/nginx/sites-enabled
# NGINX_TEMPLATE=$ROOT_DIR/config/nginx-site-template
# sudo nginx -t # make sure that the configuration is valid
# sudo service nginx restart

echo "👋  Restarting Openwhyd server ($VERSION) on port $PORT..."
cd $ROOT_DIR && source env-vars-local.sh && WHYD_PORT=$PORT npx --yes pm2 restart app.js
