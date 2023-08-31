#!/bin/bash

# List the top-level references to "usernames" that are most referenced.

npx --yes tsx scripts/legacy-refs/detect-refs.ts app/models/mongodb.js usernames top
