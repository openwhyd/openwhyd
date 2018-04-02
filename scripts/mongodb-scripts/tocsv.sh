#!/bin/bash

# gunzip -c ./$1.bson.gz | mongorestore --collection $1 --db openwhyd_dump -
keys=`mongo openwhyd_dump --eval "rs.slaveOk();var keys = []; for(var key in db.$1.find().sort({_id: -1}).limit(1)[0]) { keys.push(key); }; keys.join(',');" --quiet`
echo $keys
mongoexport -d openwhyd_dump -c $1 --type=csv --fields "$keys" >$1.csv
