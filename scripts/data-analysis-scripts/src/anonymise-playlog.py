# This script turns playlog.json.log to a csv files in which
# each line associates a user (identified by a number) to a
# youtube track id that the user listened to.
#
# It was written by Mihangy, Damien and Adrien, during Hackergarten

import json

users = dict() # uId (input) -> user number (output)
songs = dict() # eId (input), just to count unique youtube tracks

counter = 0

print('timestamp,user,song') # header of the csv file

with open("./playlog.json.log", "r") as f:
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
    print ','.join([ str(row['_t'] / 1000), str(users[row['uId']]), eId ])

# print 'found', len(songs), 'youtube tracks'
