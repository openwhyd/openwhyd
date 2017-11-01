TITLE="Playback errors codes per week"
DB=openwhyd_dump
LISTNAME=list-error-codes-per-week
FIELDS=week,total,0,100,150,timeout,video_playback_error,bad key,unrecognized_track
OUT=plot-error-codes-per-week

echo "generate data from mongodb data ... (⚠️ may take several minutes)"
# SECONDS=0
# mongo --quiet $DB ./$LISTNAME.mongo.js
# echo ⏲ $SECONDS seconds.
# write resulting collection into output csv file, with custom header row
echo $FIELDS >$OUT.temp.csv
mongoexport -d $DB -c "$LISTNAME" --type=csv --fields "$FIELDS" | tail -n+2 >>$OUT.temp.csv
# sed -i '' -e '$ d' $OUT.temp.csv # remove last line

echo "plot data to ../plots/$OUT.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-column-stacked-histogram.gp $OUT.temp.csv "$TITLE" >../plots/$OUT.png

echo "open ../plots/$OUT.png ..."
open ../plots/$OUT.png
# rm $OUT.temp.csv
