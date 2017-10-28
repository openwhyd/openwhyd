DB=openwhyd_dump
COL=user
NAME=plot-user-growth

# echo "import user collection dump into mongodb ..."
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)

echo "generate data from $COL collection ..."
echo date,total,iPhoneApp >$NAME.temp.csv # csv header row: column names
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "plot user signups chart to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c $NAME.gp $NAME.temp.csv >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.csv
