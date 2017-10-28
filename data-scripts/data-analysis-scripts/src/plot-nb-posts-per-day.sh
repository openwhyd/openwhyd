TITLE="Number of Posts per day"
DB=openwhyd_dump
COL=post
NAME=plot-nb-posts-per-day
COLUMNS=date,posts
NB_COLUMNS=2

# echo "import $COL collection dump into mongodb ..."
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)

echo "generate data from $COL collection ..."
echo $COLUMNS >$NAME.temp.csv
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "4. open output.png ..."
open ../plots/$NAME.png
rm $NAME.temp.csv
