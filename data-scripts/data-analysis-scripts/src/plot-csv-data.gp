#! /usr/bin/gnuplot

# ARG1 = input data file in csv format (comma-separated values)
# ARG2 = number of columns in data file
# ARG3 = chart title

set datafile separator ","
set terminal png size 2048,1600
set key autotitle columnheader
set title ARG3
set style data lines 
set xdata time
set timefmt "%Y-%m-%d"

plot for[i=2:ARG2] ARG1 using 1:i
