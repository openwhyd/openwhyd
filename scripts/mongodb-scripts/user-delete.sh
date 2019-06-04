USER_ID=$1

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.user.remove({id: \"$USER_ID\"})"

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.activity.deleteMany({id: \"$USER_ID\"})"

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.comment.deleteMany({uId: \"$USER_ID\"})"

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.follow.deleteMany({uId: \"$USER_ID\"})"

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.follow.deleteMany({tId: \"$USER_ID\"})"

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.notif.deleteMany({uId: \"$USER_ID\"})"

mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.post.deleteMany({uId: \"$USER_ID\"})"
