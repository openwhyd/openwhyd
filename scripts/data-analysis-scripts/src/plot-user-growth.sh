TITLE="Number of Openwhyd signups per day"
NAME="plot-user-growth"
COLUMNS="date,total,iPhoneApp"
NB_COLUMNS=3

# DB=openwhyd_dump
# COL=user
# echo "import user collection dump into mongodb ..."
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)
# echo "generate data from $COL collection ..."
# echo $COLUMNS >$NAME.temp.csv # csv header row: column names
# mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "map-reducing data from user.json.log ... (⚠️  may take several minutes)"
SECONDS=0
node json-helpers/run-mongo-script-from-json-dump.js $NAME.mongo.js ../user.json.log >$NAME.temp.json
echo ⏲  $SECONDS seconds.

echo "convert data to csv ..."
node convert-json-to-csv.js $NAME.temp.json >$NAME.temp.csv
# rename csv headers
sed -i '' "1s/.*/$COLUMNS/" $NAME.temp.csv
sed -i '' -e '$ d' $NAME.temp.csv # remove last line

echo "plot user signups chart to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.*
