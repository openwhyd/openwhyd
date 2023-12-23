#!/bin/bash

# Fail if the number of (indirect) references to "usernames" has increased.
# Don't forget to update EXPECTED_REFS_COUNT whenever references are removed.

EXPECTED_REFS_COUNT=919
REFS=$(npx --yes tsx scripts/legacy-refs/detect-refs.ts app/models/mongodb.js usernames)
REFS_COUNT=$(echo "${REFS}" | wc -l)
echo "ℹ️  Found ${REFS_COUNT} (indirect) references to 'usernames'"
if [ "${REFS_COUNT}" -gt "${EXPECTED_REFS_COUNT}" ]; then
    echo "❌  We expected to find ${EXPECTED_REFS_COUNT} references"
    echo "${REFS}"
    echo "👉  Please remove new (indirect) references to usernames"
    exit 1;
else
    echo "${REFS}"
    echo "✅  No new references were detected"
fi
