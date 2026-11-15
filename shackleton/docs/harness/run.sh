#!/bin/bash
# usage: ./run.sh <film.js args...>  (starts the local server if needed)
cd /home/claude/h
curl -s -o /dev/null localhost:8765/shackleton/index.html || { (cd root && setsid nohup python3 -m http.server 8765 >/tmp/srv.log 2>&1 < /dev/null &) ; sleep 1; }
node film.js "$@"
