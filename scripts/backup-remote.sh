if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <SSH_REMOTE> <SSH_USERNAME> <REMOTE_OPENWHYD_DIR>" >&2
  exit 1
fi

REMOTE=$1
USERNAME=$2
JSDIR=$3

mkdir _latest_backup
cd _latest_backup

echo "download configuration locally..."
# ssh root@$REMOTE "sudo tar zcvf /tmp/letsencrypt_backup.tar.gz /etc/letsencrypt &>/dev/null"
# scp -r $USERNAME@$REMOTE:/tmp/letsencrypt_backup.tar.gz .
scp -r $USERNAME@$REMOTE:/etc/nginx/sites-available .
scp -r $USERNAME@$REMOTE:/home/$USERNAME/$JSDIR/env-vars-local.sh .
source ./env-vars-local.sh

echo "dump and download remote database..."
ssh $REMOTE "mongodump --quiet --gzip -d $MONGODB_DATABASE -u $MONGODB_USER -p $MONGODB_PASS"
scp -r $USERNAME@$REMOTE:/home/$USERNAME/dump/* .

echo "gzip and download usage logs..."
ssh $REMOTE "tar -czf /tmp/usage-logs.tar.gz $JSDIR/*.json.log"
scp -r $USERNAME@$REMOTE:/tmp/usage-logs.tar.gz .

echo "gzip and download remote uploads..."
ssh $REMOTE "tar -czf /tmp/uploads-backup.tar.gz $JSDIR/uAvatarImg $JSDIR/uCoverImg $JSDIR/uPlaylistImg"
scp -r $USERNAME@$REMOTE:/tmp/uploads-backup.tar.gz .

echo "done. :-)"
