#!/bin/bash

# Restore user-generated content tables from production mongodb dump to local db

DATABASE="openwhyd_dump"
COLLECTIONS="user follow track post"
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

for COLLECTION in $COLLECTIONS
do
  echo
  echo ___
  echo Restoring collection: $COLLECTION ...
  echo
  bash $SCRIPTPATH/restore.sh $DATABASE $COLLECTION
done
