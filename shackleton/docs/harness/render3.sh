#!/bin/bash
cd /home/claude/h
export VW=1920 VH=1080
./run.sh /tmp/full3 tr/setupR.json tr/shotsR3.json > /tmp/full3_R.log 2>&1
./run.sh /tmp/full3 tr/setupB.json tr/shotsB3.json > /tmp/full3_B.log 2>&1
./run.sh /tmp/full3 tr/setupC.json tr/shotsC3.json > /tmp/full3_C.log 2>&1
echo DONE > /tmp/full3_done
