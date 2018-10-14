#!/bin/bash

# before running this script, you should have run docker login and docker build

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

VERSION_TAG="v$(node -p "require('$DIR/../package.json').version")"

echo "Uploading openwhyd/openwhyd:${VERSION_TAG}..."
docker push "openwhyd/openwhyd:${VERSION_TAG}"

echo "Uploading openwhyd/openwhyd:latest..."
docker push "openwhyd/openwhyd:latest"
