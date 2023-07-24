#!/bin/bash

# This script generate files that analyse and report the structure and complexity of the source code.
# Usage: $ scripts/code-analysis/report.sh

THIS_DIR=$(dirname "$0")

npx --yes code-complexity@v4.2.2 . \
  --filter 'app/**/*.js' \
  --sort score \
  --format \
  | perl -pe 's/\x1b\[[0-9;]*[mG]//g' \
  > ${THIS_DIR}/code-complexity.txt
cat ${THIS_DIR}/code-complexity.txt

npx --yes arkit app/ -o ${THIS_DIR}/arkit.svg
