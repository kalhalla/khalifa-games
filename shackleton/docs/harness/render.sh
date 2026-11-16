#!/bin/bash
cd /home/claude/h
export VW=1920 VH=1080
STILLS=$(cat tr/stillsA.txt) node film.js /tmp/full tr/setupA.json tr/shotsA.json > /tmp/full_A.log 2>&1
node film.js /tmp/full tr/setupB.json tr/shotsB.json > /tmp/full_B.log 2>&1
node film.js /tmp/full tr/setupC.json tr/shotsC.json > /tmp/full_C.log 2>&1
echo DONE > /tmp/full_done
