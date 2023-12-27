#!/bin/bash

set -e # stop an any error

source ./.env-prod # loads AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET

JOB_ID=$1

DATABASE_CONNECTION_ID="con_Ilnbm841MAIXvpeS"

echo "🔑 Reading token from scripts/auth0/.token ..." # from https://manage.auth0.com/dashboard/eu/openwhyd/apis/management/explorer
TOKEN="$( cat scripts/auth0/.token )"

echo "🔬 Fetching import status for job ${JOB_ID}..."
ERRORS=$( curl --request GET \
  --url "${AUTH0_ISSUER_BASE_URL}/api/v2/jobs/${JOB_ID}/errors" \
  --header "authorization: Bearer ${TOKEN}" \
  --header "content-type: application/json" \
  --form "connection_id=${DATABASE_CONNECTION_ID}" )
echo "=> Errors: ${ERRORS}"
echo "${ERRORS}" | jq .
