TITLE="Play errors (%) per day"
NAME="plot-nb-play-errors-per-day"

# echo "generate data from mongodb data ... (⚠️ may take several minutes)"
# DB=openwhyd_dump
# SECONDS=0
# mongo --quiet $DB ./$NAME.mongo.js
# echo ⏲ $SECONDS seconds.

echo "process map-reduce on json log ... (⚠️  may take several minutes)"
SECONDS=0
node json-helpers/run-mongo-script-from-json-dump.js $NAME.mongo.js ../playlog.json.log >$NAME.temp.json
echo ⏲  $SECONDS seconds. # took ~6 mn, instead of 11 when map-reducing on mongodb collection

# # write resulting collection into output csv file, with custom header row
# FIELDS="_id,value.total,value.yt,value.sc,value.dm,value.vi,value.dz,value.ja,value.bc,value.fi,value.sp"
# COLUMNS="Date,% of play errors,Youtube errors,SoundCloud errors,Dailymotion errors,Vimeo errors,Deezer errors,Jamendo errors,Bandcamp errors,Audio file errors,Spotify errors"
# NB_COLUMNS=`echo $COLUMNS | sed 's/[^,]//g' | wc -c` # count COLUMNS
# echo $COLUMNS >$NAME.temp.csv
# mongoexport -d $DB -c "$NAME" --type=csv --fields "$FIELDS" | tail -n+2 >>$NAME.temp.csv

echo "convert data to csv ..."
node convert-json-to-csv.js $NAME.temp.json >$NAME.temp.csv
# rename csv headers
sed -i '' 's/value./ /g; s/_err/ (error)/g; s/yt/Youtube/; s/sc/Soundcloud/; s/dm/Dailymotion/; s/vi/Vimeo/; s/dz/Deezer/; s/ja/Jamendo/; s/bc/Bandcamp/; s/fi/File/; s/sp/Spotify/; s/xx/(unknown)/;' $NAME.temp.csv
sed -i '' -e '$ d' $NAME.temp.csv # remove last line

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
NB_COLUMNS=`head -n 1 $NAME.temp.csv | sed 's/[^,]//g' | wc -c`
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
rm $NAME.temp.*
