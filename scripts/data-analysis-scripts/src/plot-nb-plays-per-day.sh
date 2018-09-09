TITLE="Number of plays per day"
NAME="plot-nb-plays-per-day"

# DB=openwhyd_dump
# FIELDS=_id,value.total,value.yt,value.sc,value.dm,value.vi,value.dz,value.ja,value.bc,value.fi,value.sp
# COLUMNS="Date,Total plays,Youtube,SoundCloud,Dailymotion,Vimeo,Deezer,Jamendo,Bandcamp,Audio file,Spotify"
# NB_COLUMNS=`echo $COLUMNS | sed 's/[^,]//g' | wc -c` # count COLUMNS

echo "map-reducing data from playlog ... (⚠️  may take several minutes)"
SECONDS=0
# mongo --quiet $DB ./$NAME.mongo.js
node json-helpers/run-mongo-script-from-json-dump.js $NAME.mongo.js ../playlog.json.log >../logs/$NAME.temp.json
echo ⏲  $SECONDS seconds.

# write resulting collection into output csv file, with custom header row
# echo $COLUMNS >$NAME.temp.csv
# mongoexport -d $DB -c "$NAME" --type=csv --fields "$FIELDS" | tail -n+2 >>$NAME.temp.csv

echo "convert data to csv ..."
node convert-json-to-csv.js ../logs/$NAME.temp.json >../logs/$NAME.temp.csv
# rename csv headers
sed -i '' 's/_id/Date/; s/value.//g; s/total/Total plays/g; s/yt/Youtube/g; s/sc/Soundcloud/g; s/dm/Dailymotion/g; s/vi/Vimeo/g; s/dz/Deezer/g; s/ja/Jamendo/g; s/bc/Bandcamp/g; s/fi/Audio file/g; s/sp/Spotify/g' ../logs/$NAME.temp.csv
sed -i '' -e '$ d' ../logs/$NAME.temp.csv # remove last line

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
NB_COLUMNS=`head -n 1 $NAME.temp.csv | sed 's/[^,]//g' | wc -c`
gnuplot -c plot-csv-data.gp ../logs/$NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm ../logs/$NAME.temp.*
