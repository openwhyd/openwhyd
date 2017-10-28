#!/bin/bash

mongodump -d ${MONGODB_DATABASE} $@
# port 30000

cd dump
mkdir ${MONGODB_DATABASE}_logs &>/dev/null
cd ${MONGODB_DATABASE}_logs
mv ../${MONGODB_DATABASE}/playlog.* ./
mv ../${MONGODB_DATABASE}/session.* ./
mv ../${MONGODB_DATABASE}/email_corrupted.* ./
mv ../${MONGODB_DATABASE}/fbfriends.* ./
mv ../${MONGODB_DATABASE}/visit.* ./
