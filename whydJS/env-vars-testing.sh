# run ". env-vars-testing.sh" so that the following environment variables are usable
# in your current current shell session, before running tests

set -o allexport
. ./env-vars-testing.conf # that file contains the actual configuration variables
set +o allexport
