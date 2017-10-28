#! /usr/bin/gnuplot

set datafile separator ","
set terminal png size 2048,1600
set key autotitle columnheader
set title "Number of Posts per day"
set style data lines 
set ylabel "Posts"
set xlabel "Time"
set xdata time
set timefmt "%Y-%m-%d"
set xrange ['2012-06-01':'2017-07-22']

plot for[i=2:2] ARG1 using 1:i
