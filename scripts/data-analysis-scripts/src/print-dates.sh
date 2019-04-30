FILENAME=$1

HEAD=$(head -n 1 ${FILENAME})
TAIL=$(tail -n 1 ${FILENAME})

START1=$(gdate -d @$(echo ${HEAD} | jq ._t/1000))
END1=$(gdate -d @$(echo ${TAIL} | jq ._t/1000))

HEAD_OID=$(echo ${HEAD} | jq ._id["$oid"])
START2=$(node -e "console.log(new Date(parseInt(${HEAD_OID}.slice(0,8), 16)*1000));")

TAIL_OID=$(echo ${TAIL} | jq ._id["$oid"])
END2=$(node -e "console.log(new Date(parseInt(${TAIL_OID}.slice(0,8), 16)*1000));")

echo "From ${START1} ${START2}"
echo "To ${END1} ${END2}"



