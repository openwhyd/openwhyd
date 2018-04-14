TITLE="Number of Users listening per day"
NAME="plot-nb-users-listening-per-day"
COLUMNS="date,users"
NB_COLUMNS=2

# DB=openwhyd_dump
# echo "generate data from mongodb data ... (⚠️ may take several minutes)"
# echo $COLUMNS >$NAME.temp.csv
# SECONDS=0
# mongo --quiet $DB ./$NAME.mongo.js # took 10 minutes to run
# echo ⏲ $SECONDS seconds.
# mongoexport -d "$DB" -c "$NAME" --type=csv --fields "_id,value" | tail -n+2  >>$NAME.temp.csv

echo "map-reducing data from playlog ... (⚠️  may take several minutes)"
SECONDS=0
node json-helpers/run-mongo-script-from-json-dump.js $NAME.mongo.js ../playlog.json.log >$NAME.temp.json
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
# rm $NAME.temp.csv
