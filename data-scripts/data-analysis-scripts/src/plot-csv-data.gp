#! /usr/bin/gnuplot

# ARG1 = input data file in csv format (comma-separated values)
# ARG2 = number of columns in data file (ignored)
# ARG3 = chart title

set datafile separator ","        # data fields separator from input
set terminal png size 2048,1600   # output image settings
set key autotitle columnheader    # use header row for titles
set style data lines              # chart mode: lines
set xdata time                    # tell gnu plot that x axis = time/dates
set timefmt "%Y-%m-%d"            # timedate format: year-month-day
set title ARG3                    # chart title, displayed on top

plot for[i=2:*] ARG1 using 1:i
