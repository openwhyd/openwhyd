TITLE="Number of Users listening per day"
DB=openwhyd_dump
NAME=plot-nb-users-listening-per-day
COLUMNS=date,users
NB_COLUMNS=2

echo "generate data from mongodb data ... (⚠️ may take several minutes)"
echo $COLUMNS >$NAME.temp.csv
SECONDS=0
mongo --quiet $DB ./$NAME.mongo.js # took 10 minutes to run
echo ⏲ $SECONDS seconds.
mongoexport -d "$DB" -c "$NAME" --type=csv --fields "_id,value" | tail -n+2  >>$NAME.temp.csv

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
# rm $NAME.temp.csv
