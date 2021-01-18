curl -X "POST" "https://api.sendgrid.com/api/mail.send.json" \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -H 'Authorization: Bearer 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' \
     --data-urlencode "to=adrien.joly@gmail.com" \
     --data-urlencode "subject=Example Subject" \
     --data-urlencode "text=testingtextbody" \
     --data-urlencode "from=contact@openwhyd.org"
