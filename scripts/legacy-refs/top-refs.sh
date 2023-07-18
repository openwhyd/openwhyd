#!/bin/bash

# List the top-level references to "usernames" that are most referenced.

npx tsx scripts/legacy-refs/detect-refs.ts app/models/mongodb.js usernames top
