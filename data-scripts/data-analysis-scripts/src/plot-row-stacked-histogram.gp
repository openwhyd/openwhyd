#! /usr/bin/gnuplot

# ARG1 = input data file in csv format (comma-separated values)
# ARG2 = chart title

set datafile separator ","        # data fields separator from input
set terminal png size 2048,1600   # output image settings
set style data histogram          # histogram mode
set style histogram rowstacked    # one bar per data row
set boxwidth 0.6 relative         # separation between bars
set xtics rotate out              # rotate dates for more clarity
set style fill solid border       # solid bars
set title ARG2                    # chart title, displayed on top

plot for[COL=2:*] ARG1 using COL:xticlabels(1) title columnheader
