# This script turns playlog.json.log to a csv files in which
# each line associates a user (identified by a number) to a
# youtube track id that the user listened to.
#
# It was written by Mihangy, Damien and Adrien, during Hackergarten

import time
import json
from bson import ObjectId  # To install it: `$ pip3 install pymongo`

users = dict() # uId (input) -> user number (output)
songs = dict() # eId (input), just to count unique youtube tracks

counter = 0

# == Print anonymised playlog to stdout
print('timestamp,user,song') # header of the csv file
with open("./fullplaylog.json.log", "r") as f:
  for line in f:
    counter = counter + 1
    # if counter == 10:
    #   break
    row = json.loads(line)
    # identify songs
    if '/yt/' in row['eId']:
      eId = row['eId'][4:]
      songs[eId] = 1
    # identify users
    if row['uId'] not in users:
      users[row['uId']] = len(users)

    if '_t' in row:
      timestamp = row['_t'] // 1000
    elif '_id' in row:
      timestamp = int(time.mktime(ObjectId(row['_id']['$oid']).generation_time.timetuple()))
    
    print (','.join([ str(timestamp), str(users[row['uId']]), eId ]))

# == Print anonymised playlog to stdout
# print (','.join([ 'openwhyd_user_id', 'anonymous_user_id' ]))
# for user in users:
#   print (','.join([ user, str(users[user]) ]))

# print 'found', len(songs), 'youtube tracks'
