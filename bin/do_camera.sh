#!/bin/sh
 v4l2-ctl -d /dev/video$1 -c brightness=60,contrast=160,saturation=100,gamma=0,exposure_absolute=140,exposure_auto=1,white_balance_temperature_auto=0,exposure_auto_priority=0
 echo /dev/video$1
