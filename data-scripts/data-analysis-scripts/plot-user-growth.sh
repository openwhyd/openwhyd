DB=openwhyd_data
COL=user
NAME=plot-user-growth

echo "1. import user collection dump into mongodb ..."
# mongorestore  --db $DB --collection $COL --drop $COL.bson

echo "2. export users to $NAME.output.csv ..."
# mongoexport --db $DB --collection $COL --type=csv --fields "_id,iRf" >$NAME.output.csv

echo "3. render signup dates to $NAME.output2.csv ..."
# cat $NAME.output.csv | node objectid-to-date.js >$NAME.output2.csv 

echo "4. count total user signups per day ..."
# cat $NAME.output2.csv | grep -E '^[0-9]{4,}' | cut -d',' -f1 | uniq -c | awk '{ print $2, $1 }' >$NAME.output3.csv

echo "4b. count user signups per referer, per day ..."
# cat $NAME.output2.csv | grep -E '^[0-9]{4,}' | node group-by-ref.js >$NAME.output3.csv

echo "5. plot user signups chart to $NAME.output.png ..."
gnuplot -c $NAME.gp $NAME.output3.csv >$NAME.output.png

echo "6. open $NAME.output.png ..."
open $NAME.output.png
