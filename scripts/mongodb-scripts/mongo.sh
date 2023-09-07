#!/bin/bash

# Start Mongo Shell against the production database.

# Usage from the project's root directory:
# $ scripts/mongodb-scripts/mongo.sh

echo "🔑 Reading DB credentials from ./env-vars-local.sh ..."
source ./env-vars-local.sh

echo "ℹ️ Press Ctrl-C to exit."
mongo ${MONGODB_DATABASE} -u ${MONGODB_USER} -p ${MONGODB_PASS}
