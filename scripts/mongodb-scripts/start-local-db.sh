#!/bin/bash
mkdir db $>/dev/null
mongod --dbpath db

# press ctrl-c to kill the server.
# then, feel free to delete the db folder when you're done.
