TITLE="Play errors (%) per day"
DB=openwhyd_dump
NAME=plot-nb-play-errors-per-day
FIELDS=_id,value.total,value.yt,value.sc,value.dm,value.vi,value.dz,value.ja,value.bc,value.fi,value.sp
COLUMNS="Date,% of play errors,Youtube errors,SoundCloud errors,Dailymotion errors,Vimeo errors,Deezer errors,Jamendo errors,Bandcamp errors,Audio file errors,Spotify errors"
# from https://github.com/openwhyd/openwhyd/blob/d27fb71220cbd29e9e418bd767426e3b4a2187f3/whydJS/public/js/whydPlayer.js#L559
NB_COLUMNS=`echo $COLUMNS | sed 's/[^,]//g' | wc -c` # count COLUMNS

echo "generate data from mongodb data ... (⚠️ may take several minutes)"
SECONDS=0
mongo --quiet $DB ./$NAME.mongo.js
echo ⏲ $SECONDS seconds.
# write resulting collection into output csv file, with custom header row
echo $COLUMNS >$NAME.temp.csv
mongoexport -d $DB -c "$NAME" --type=csv --fields "$FIELDS" | tail -n+2 >>$NAME.temp.csv
sed -i '' -e '$ d' $NAME.temp.csv # remove last line

echo "plot data to ../plots/$NAME.png ..."
mkdir ../plots &>/dev/null
gnuplot -c plot-csv-data.gp $NAME.temp.csv $NB_COLUMNS "$TITLE" >../plots/$NAME.png

echo "open ../plots/$NAME.png ..."
open ../plots/$NAME.png
# rm $NAME.temp.csv
