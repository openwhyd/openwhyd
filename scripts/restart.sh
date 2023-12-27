#!/bin/bash

set -e # stop an any error

# Constants
ROOT_DIR="`pwd`/.."
PORT="1095"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")
NODE="$(which node)"
GIT_COMMIT_SHA=$(git rev-parse HEAD)
GIT_REPOSITORY_URL="git@github.com:openwhyd/openwhyd.git"

# NGINX_ENBLD=/etc/nginx/sites-enabled
# NGINX_TEMPLATE=$ROOT_DIR/config/nginx-site-template
# sudo nginx -t # make sure that the configuration is valid
# sudo service nginx restart

echo "👋  Restarting Openwhyd server ${VERSION} on port ${PORT}, with ${NODE}..."
cd ${ROOT_DIR}
source env-vars-local.sh
echo "AUTH0_ISSUER_BASE_URL=${AUTH0_ISSUER_BASE_URL}"
DD_GIT_COMMIT_SHA="${GIT_COMMIT_SHA}" \
DD_GIT_REPOSITORY_URL="${GIT_REPOSITORY_URL}" \
WHYD_PORT=${PORT} \
  npx --yes pm2 restart app.js --interpreter=${NODE} --update-env
