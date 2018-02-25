# restores a .bson.gz collection dump into a local mongodb database
# usage: restore.sh <destination_database_name> <input_collection_name>

DATABASE=$1
COLLECTION=$2
gunzip -c ./$COLLECTION.bson.gz | mongorestore --drop -c $COLLECTION --db $DATABASE -
