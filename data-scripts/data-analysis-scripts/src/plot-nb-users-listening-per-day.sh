TITLE="Number of Users listening per day"
DB=openwhyd_dump
NAME=plot-nb-users-listening-per-day
COLUMNS=date,users
NB_COLUMNS=2

echo "generate data from mongodb data ... (⚠️ may take several minutes)"
echo $COLUMNS >$NAME.temp.csv
SECONDS=0
# mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv # runs in 4 seconds
mongo --quiet $DB ./$NAME.mongo-test.js >>$NAME.temp.csv # runs in 15 seconds
echo ⏲ $SECONDS seconds.

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
# rm $NAME.temp.csv
