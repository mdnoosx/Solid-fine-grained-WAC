#!/usr/bin/python

import getopt
import sys
import re

inputfile = "500short_annotations.ttl"
outputfile = "500annotations.ttl"

old = open(inputfile)
f = open(outputfile, "w")
for line in old:
    x = re.sub("[.]\n", " .\n", line)
    f.write(x)
old.close()
f.close()


