#!/bin/bash
cd /home/claude/h
export VW=1920 VH=1080
STILLS=$(cat tr/stillsA.txt) ./run.sh /tmp/full4 tr/setupA.json tr/shotsA.json > /tmp/full4_A.log 2>&1
./run.sh /tmp/full4 tr/setupR.json tr/shotsR4.json > /tmp/full4_R.log 2>&1
./run.sh /tmp/full4 tr/setupB.json tr/shotsB4.json > /tmp/full4_B.log 2>&1
./run.sh /tmp/full4 tr/setupC.json tr/shotsC4.json > /tmp/full4_C.log 2>&1
echo DONE > /tmp/full4_done
