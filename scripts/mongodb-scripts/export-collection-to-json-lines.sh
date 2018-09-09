#!/bin/bash

DB_NAME="$1"
COLLECTION_NAME="$2"

# Exports collection $COLLECTION_NAME from the $DB_NAME database, to a file with 1 json document per line.

echo "Exporting local $COLLECTION_NAME collection to ./$COLLECTION_NAME.json ..."
mongoexport -d $DB_NAME -c $COLLECTION_NAME --type=json --out ./$COLLECTION_NAME.json.log
