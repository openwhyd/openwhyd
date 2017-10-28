gunzip -c ./$1.bson.gz | mongorestore --collection $1 --db openwhyd_dump -
