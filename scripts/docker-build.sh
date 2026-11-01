#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

VERSION_TAG="v$(node -p "require('$DIR/../package.json').version")"
GIT_COMMIT_SHA="$(git -C "$DIR/.." rev-parse HEAD)"

echo "Building docker image openwhyd/openwhyd:${VERSION_TAG}..."

docker build "$DIR/.." \
  --build-arg "GIT_COMMIT_SHA=${GIT_COMMIT_SHA}" \
  -t "openwhyd/openwhyd:${VERSION_TAG}" \
  -t "openwhyd/openwhyd:latest"
