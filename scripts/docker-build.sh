#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

VERSION_TAG="v$(node -p "require('$DIR/../package.json').version")"

echo "Building docker image openwhyd/openwhyd:${VERSION_TAG}..."

docker build $DIR/.. \
  -t "openwhyd/openwhyd:${VERSION_TAG}" \
  -t "openwhyd/openwhyd:latest"
