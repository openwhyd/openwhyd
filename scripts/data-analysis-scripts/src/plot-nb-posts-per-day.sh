TITLE="Number of Posts per day"
NAME="plot-nb-posts-per-day"
COLUMNS="date,posts"
NB_COLUMNS=2

# echo "import $COL collection dump into mongodb ..."
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)
# DB=openwhyd_dump
# COL=post
# echo "generate data from $COL collection ..."
# echo $COLUMNS >$NAME.temp.csv
# mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "map-reducing data from post.json.log ... (⚠️  may take several minutes)"
SECONDS=0
node json-helpers/run-mongo-script-from-json-dump.js $NAME.mongo.js ../post.json.log >$NAME.temp.json
echo ⏲  $SECONDS seconds.

echo "convert data to csv ..."
node convert-json-to-csv.js $NAME.temp.json >$NAME.temp.csv
# rename csv headers
sed -i '' "1s/.*/$COLUMNS/" $NAME.temp.csv
sed -i '' -e '$ d' $NAME.temp.csv # remove last line

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.*
