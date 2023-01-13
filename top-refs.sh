#!/bin/bash

# List the top-level references to "usernames" that are most referenced.

npx tsx detect-refs.ts app/models/mongodb.js usernames top
