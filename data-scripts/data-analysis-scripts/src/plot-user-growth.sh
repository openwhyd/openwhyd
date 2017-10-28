DB=openwhyd_dump
COL=user
NAME=plot-user-growth

# echo "import user collection dump into mongodb ..."
# # mongorestore  --db $DB --collection $COL --drop $COL.bson
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)

# echo "export users to $NAME.output.csv ..."
# mongoexport --db $DB --collection $COL --type=csv --fields "_id,iRf" >$NAME.output.csv

# echo "render signup dates to $NAME.output2.csv ..."
# cat $NAME.output.csv | node objectid-to-date.js >$NAME.output2.csv 

# echo "count total user signups per day ..."
# cat $NAME.output2.csv | grep -E '^[0-9]{4,}' | cut -d',' -f1 | uniq -c | awk '{ print $2, $1 }' >$NAME.output3.csv

# echo "count user signups per referer, per day ..."
# cat $NAME.output2.csv | grep -E '^[0-9]{4,}' | node group-by-ref.js >$NAME.output3.csv

echo "generate data from $COL collection ..."
echo date,total,iPhoneApp >$NAME.output3.csv
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.output3.csv

echo "plot user signups chart to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c $NAME.gp $NAME.output3.csv >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
