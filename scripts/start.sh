#!/bin/bash

ROOT_DIR="`pwd`/.."
PORT="1095"
VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")
NODE="$(nvm which default)"

echo "🌄  Starting Openwhyd ${VERSION} on port ${PORT}, with ${NODE}..."
cd ${ROOT_DIR} && source env-vars-local.sh && WHYD_PORT=${PORT} npx --yes pm2 start app.js --interpreter=${NODE}
