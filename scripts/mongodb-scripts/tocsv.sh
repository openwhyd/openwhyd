#!/bin/bash

DB_NAME="openwhyd_dump"
COLLECTION_NAME="$1"

# Exports collection $COLLECTION_NAME from the $DB_NAME database, to a csv file.
# Auto-extracts columns by fetching fields from the last record.

# gunzip -c ./$COLLECTION_NAME.bson.gz | mongorestore --collection $COLLECTION_NAME --db $DB_NAME -

keys=`mongo openwhyd_dump --eval "rs.slaveOk();var keys = []; for(var key in db.$COLLECTION_NAME.find().sort({_id: -1}).limit(1)[0]) { keys.push(key); }; keys.join(',');" --quiet`
echo Keys: $keys

mongoexport -d $DB_NAME -c $COLLECTION_NAME --type=csv --fields "$keys" >$COLLECTION_NAME.csv
