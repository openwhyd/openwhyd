TITLE="Number of Users posting per day"
DB=openwhyd_dump
NAME=plot-nb-users-posting-per-day
COLUMNS=date,users
NB_COLUMNS=2

echo "generate data from mongodb data ..."
echo $COLUMNS >$NAME.temp.csv
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.csv
