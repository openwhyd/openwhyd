#!/bin/bash
#mongorestore --dbpath db -d ${MONGODB_DATABASE} -c user ./user.bson $@
#mongorestore --drop --port ${MONGODB_PORT} -d ${MONGODB_DATABASE} -c user ./user.bson $@
mongorestore -d ${MONGODB_DATABASE} dump/${MONGODB_DATABASE} $@
echo "Done. Don\'t forget to run: mongo initdb.js"
