USER_ID=$1

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.user.findOne({id: \"$USER_ID\"}))" >user.json

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.activity.find({id: \"$USER_ID\"}).toArray())" >activities.json

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.comment.find({uId: \"$USER_ID\"}).toArray())" >comments.json

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.follow.find({uId: \"$USER_ID\"}).toArray())" >follow1.json

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.follow.find({tId: \"$USER_ID\"}).toArray())" >follow2.json

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.notif.find({uId: \"$USER_ID\"}).toArray())" >notifs.json

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"printjson(db.post.find({uId: \"$USER_ID\"}).toArray())" >posts.json
