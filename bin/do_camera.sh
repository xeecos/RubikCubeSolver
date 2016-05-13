#!/bin/sh
 v4l2-ctl -d /dev/video$1 -c saturation=80,brightness=50,contrast=80,gamma=10,exposure_auto=1,exposure_absolute=150,white_balance_temperature_auto=0
 echo /dev/video$1
