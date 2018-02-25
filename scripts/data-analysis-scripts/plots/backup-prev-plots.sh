echo 'Appending ".prev" suffix to all existing png files (generated plots)...'
for f in *.png; do mv "$f" "${f%.*}.prev.${f##*.}"; done;
