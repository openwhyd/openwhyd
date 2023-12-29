#!/bin/bash

# This script imports test users to our development Auth0 account, for testing.
# Based on procedure: https://auth0.com/docs/manage-users/user-migration/bulk-user-imports

# Usage, from project root dir:
# $ scripts/auth0/import-test-users.sh

set -e # stop an any error

source ./env-vars-testing-local.sh # loads AUTH0_ISSUER_BASE_URL

USERS_FILE="scripts/auth0/test-users.json" # data export from config/initdb_testing.js
TIMESTAMP="$( date +'%Y-%m-%d_%H-%M' )"
DATABASE_CONNECTION_ID="con_xIBYN4thujtVIa1R"

# echo "🔑 Generating a token..."
# TOKEN=$( curl --request POST \
#   --url "${AUTH0_ISSUER_BASE_URL}/oauth/token" \
#   --header "content-type: application/x-www-form-urlencoded" \
#   --data "grant_type=client_credentials" \
#   --data "client_id=${AUTH0_CLIENT_ID}" \
#   --data "client_secret=${AUTH0_CLIENT_SECRET}" \
#   --data "audience=${AUTH0_ISSUER_BASE_URL}/api/v2/" \
#   | jq --raw-output ".access_token" )
# echo "=> ${TOKEN}" # note: this token causes "Insufficient scope, expected any of: create:users" when trying to import

echo "🔑 This script will read a token from scripts/auth0/.token ..."
echo "=> Please get it from: https://manage.auth0.com/dashboard/eu/dev-vh1nl8wh3gmzgnhp/apis/management/explorer"
read -p "Press any key to continue... " -n1 -s

echo "🔑 Reading token from scripts/auth0/.token ..."
TOKEN="$( cat scripts/auth0/.token )"

echo "🚚 Importing users from ${USERS_FILE}..."
RESPONSE=$( curl --request POST \
  --url "${AUTH0_ISSUER_BASE_URL}/api/v2/jobs/users-imports" \
  --header "authorization: Bearer ${TOKEN}" \
  --form users=@${USERS_FILE} \
  --form connection_id="${DATABASE_CONNECTION_ID}" \
  --form external_id="import-test-users-${TIMESTAMP}" \
  --form upsert="true" )
echo "=> Response: ${RESPONSE}"

echo "🧗‍♀️ Waiting for import..."
sleep 5

echo "🔬 Fetching import status..."
JOB_ID=$( echo "${RESPONSE}" | jq --raw-output ".id" )
echo "=> Job id: ${JOB_ID}"
ERRORS=$( curl --request GET \
  --url "${AUTH0_ISSUER_BASE_URL}/api/v2/jobs/${JOB_ID}/errors" \
  --header "authorization: Bearer ${TOKEN}" \
	--header "content-type: application/json" \
  --form "connection_id=${DATABASE_CONNECTION_ID}" )
echo "=> Errors: ${ERRORS}"
echo "${ERRORS}" | jq .
