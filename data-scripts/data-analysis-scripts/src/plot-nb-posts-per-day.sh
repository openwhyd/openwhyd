DB=openwhyd_dump
COL=post
NAME=plot-nb-posts-per-day

# echo "import $COL collection dump into mongodb ..."
# ../../mongodb-scripts/restore.sh $COL # will restore collection from $COL.bson.gz (compressed dump)

echo "generate data from $COL collection ..."
echo date,posts >$NAME.temp.csv
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.temp.csv

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c $NAME.gp $NAME.temp.csv >../plots/$NAME.png

echo "4. open output.png ..."
open ../plots/$NAME.png
rm $NAME.temp.csv
