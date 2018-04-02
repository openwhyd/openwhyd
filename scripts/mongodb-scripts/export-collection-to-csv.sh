#!/bin/bash

DB_NAME="$1"
COLLECTION_NAME="$2"

# Exports collection $COLLECTION_NAME from the $DB_NAME database, to a csv file.
# Auto-extracts columns by fetching fields from the last record.

keys=`mongo openwhyd_dump --eval "rs.slaveOk();var keys = []; for(var key in db.$COLLECTION_NAME.find().sort({_id: -1}).limit(1)[0]) { keys.push(key); }; keys.join(',');" --quiet`
echo Keys: $keys

mongoexport -d $DB_NAME -c $COLLECTION_NAME --type=csv --fields "$keys" >$COLLECTION_NAME.csv
