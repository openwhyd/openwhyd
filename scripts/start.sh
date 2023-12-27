#!/bin/bash

set -e # stop an any error

# Constants
ROOT_DIR="`pwd`/.."
PORT="1095"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")
NODE="$(which node)"
GIT_COMMIT_SHA=$(git rev-parse HEAD)
GIT_REPOSITORY_URL="git@github.com:openwhyd/openwhyd.git"

echo "🌄  Starting Openwhyd ${VERSION} on port ${PORT}, with ${NODE}..."
cd ${ROOT_DIR}
source env-vars-local.sh
DD_GIT_COMMIT_SHA="${GIT_COMMIT_SHA}" \
DD_GIT_REPOSITORY_URL="${GIT_REPOSITORY_URL}" \
WHYD_PORT=${PORT} \
  npx --yes pm2 start ecosystem.config.js --interpreter=${NODE}
