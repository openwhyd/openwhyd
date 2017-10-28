DB=openwhyd_dump
COL=post
NAME=plot-nb-posts-per-day

# echo "1. import post collection dump into mongodb ..."
# mongorestore  --db $DB --collection $COL --drop $COL.bson

echo "2. generate data from post collection ..."
echo date,posts >$NAME.output.csv
mongo --quiet $DB ./$NAME.mongo.js >>$NAME.output.csv

echo "3. plot data to output.png ..."
gnuplot -c $NAME.gp $NAME.output.csv >$NAME.output.png

echo "4. open output.png ..."
open $NAME.output.png
