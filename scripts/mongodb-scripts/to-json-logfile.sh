#!/bin/bash

DB_NAME="openwhyd_dump"
COLLECTION_NAME="$1"

# Exports collection $COLLECTION_NAME from the $DB_NAME database, to a file with 1 json document per line.
# Auto-extracts columns by fetching fields from the last record.

echo "Restoring ./$COLLECTION_NAME.bson.gz to local $DB_NAME database ..."
gunzip -c ./$COLLECTION_NAME.bson.gz | mongorestore --collection $COLLECTION_NAME --db $DB_NAME -

echo "Exporting local $COLLECTION_NAME collection to ./$COLLECTION_NAME.json ..."
mongoexport -d $DB_NAME -c $COLLECTION_NAME --type=json --out ./$COLLECTION_NAME.json
