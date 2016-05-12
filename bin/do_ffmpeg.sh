#!/bin/sh
v4l2-ctl -c saturation=50,brightness=100,contrast=50,gamma=6,exposure_auto=1,exposure_absolute=200,white_balance_temperature_auto=1
ffmpeg -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video \
-b 800k -r 30 http://127.0.0.1:8082

