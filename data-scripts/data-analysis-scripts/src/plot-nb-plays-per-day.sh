TITLE="Number of plays per day"
DB=openwhyd_dump
NAME=plot-nb-plays-per-day

echo "generate data from mongodb data ... (⚠️ may take several minutes)"
SECONDS=0
mongo --quiet $DB ./$NAME.mongo.js
echo ⏲ $SECONDS seconds.
# extract fields from resulting collection
keys=`mongo $DB --eval "rs.slaveOk();var keys = ['_id']; for(var key in db['$NAME'].find().sort({_id: -1}).limit(1)[0].value) { keys.push('value.' + key); }; keys.join(',');" --quiet`
# remove "value." prefixes from field names
columns=${keys//value./}
# generate csv file header, based on field names
echo $columns >$NAME.temp.csv
# count fields
nb_columns=`echo $columns | sed 's/[^,]//g' | wc -c`
# append resulting collection into output csv file
mongoexport -d $DB -c "$NAME" --type=csv --fields "$keys" | tail -n+2 >>$NAME.temp.csv
sed -i '' -e '$ d' $NAME.temp.csv # remove last line

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $nb_columns "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
# rm $NAME.temp.csv
