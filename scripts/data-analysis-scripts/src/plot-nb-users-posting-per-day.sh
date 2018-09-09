TITLE="Number of Users posting per day"
NAME="plot-nb-users-posting-per-day"
COLUMNS="date,users"
NB_COLUMNS=2

# DB=openwhyd_dump
# echo "generate data from mongodb data ..."
# echo $COLUMNS >$NAME.temp.csv
# mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "map-reducing data from post.json.log ... (⚠️  may take several minutes)"
SECONDS=0
echo $COLUMNS >$NAME.temp.csv
node json-helpers/run-mongo-script-from-json-dump.js $NAME.mongo.js ../post.json.log >>$NAME.temp.csv
sed -i '' -e '$ d' $NAME.temp.csv # remove last line
echo ⏲  $SECONDS seconds.

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.*
