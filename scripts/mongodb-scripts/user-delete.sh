USER_ID=$1

echo "user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.user.deleteOne({_id: \"$USER_ID\"})"

echo "activity of user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.activity.deleteMany({id: \"$USER_ID\"})"

echo "comments of user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.comment.deleteMany({uId: \"$USER_ID\"})"

echo "subscriptions of user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.follow.deleteMany({uId: \"$USER_ID\"})"

echo "subscriptions to user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.follow.deleteMany({tId: \"$USER_ID\"})"

echo "notifications of user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.notif.deleteMany({uId: \"$USER_ID\"})"

echo "posts of user $USER_ID..."
mongo $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS --quiet --eval \
"db.post.deleteMany({uId: \"$USER_ID\"})"
