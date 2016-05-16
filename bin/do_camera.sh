#!/bin/sh
 v4l2-ctl -d /dev/video$1 -c brightness=50,contrast=160,saturation=100,gamma=0,gain=1000,exposure_auto_priority=0,exposure_absolute=400,exposure_auto=0
 echo /dev/video$1
