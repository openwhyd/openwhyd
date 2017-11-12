#!/bin/bash

for i in $( seq 1 2); do
  sed -i '' -e "s/^,/$2,/" -e "s/,,/,$2,/g" -e "s/,$/,$2/" $1
done
