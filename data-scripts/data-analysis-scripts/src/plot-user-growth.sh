TITLE="Number of Openwhyd signups per day"
DB=openwhyd_dump
COL=user
NAME=plot-user-growth
COLUMNS=date,total,iPhoneApp
NB_COLUMNS=3

# echo "import user collection dump into mongodb ..."
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)

echo "generate data from $COL collection ..."
echo $COLUMNS >$NAME.temp.csv # csv header row: column names
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "plot user signups chart to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.csv
