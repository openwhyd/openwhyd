#!/bin/bash

# This script imports prod users to our prod Auth0 account.
# Based on procedure: https://auth0.com/docs/manage-users/user-migration/bulk-user-imports

# Usage, from project root dir:
# 1. $ mongoexport -d ${dbname} -c user --type=json --out ./prod-users.json-lines -u ${dbuser} -p ${dbpassword}
# 2. $ node ./scripts/auth0/prepare-import-batches.js # => create files: `prod-users-*.for-auth0.json`
# 3. $ ./scripts/auth0/import-prod-users.sh

set -e # stop an any error

source ./.env-prod # loads AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET

TIMESTAMP="$( date +'%Y-%m-%d_%H-%M' )"
DATABASE_CONNECTION_ID="con_Ilnbm841MAIXvpeS"

echo "🔑 Reading token from scripts/auth0/.token ..." # from https://manage.auth0.com/dashboard/eu/openwhyd/apis/management/explorer
TOKEN="$( cat scripts/auth0/.token )"

# Iterate through all files matching the "prod-users-*.json" pattern
for USERS_FILE in prod-users-*.json; do

  echo "\n🚚 Importing users from ${USERS_FILE}..."
  RESPONSE=$( curl --request POST \
    --url "${AUTH0_ISSUER_BASE_URL}/api/v2/jobs/users-imports" \
    --header "authorization: Bearer ${TOKEN}" \
    --form users=@${USERS_FILE} \
    --form connection_id="${DATABASE_CONNECTION_ID}" \
    --form external_id="import-test-users-${TIMESTAMP}" \
    --form upsert="true" )
  echo "=> Response: ${RESPONSE}"

  echo "\n🧗‍♀️ Waiting for import job to complete..."
  sleep 180

  echo "\n🔬 Fetching import status..."
  JOB_ID=$( echo "${RESPONSE}" | jq --raw-output ".id" )
  echo "=> Job id: ${JOB_ID}"
  ERRORS=$( curl --request GET \
    --url "${AUTH0_ISSUER_BASE_URL}/api/v2/jobs/${JOB_ID}/errors" \
    --header "authorization: Bearer ${TOKEN}" \
    --header "content-type: application/json" \
    --form "connection_id=${DATABASE_CONNECTION_ID}" )
  echo "=> Errors: ${ERRORS}"
  echo "${ERRORS}" | jq .

  echo \n"🧗‍♀️ Will start next import in 10 seconds..."
  sleep 10

done

echo "✅ Done!"
