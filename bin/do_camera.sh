#!/bin/sh
v4l2-ctl -d /dev/video0 -c saturation=90,brightness=100,contrast=50,gamma=10,exposure_auto=1,exposure_absolute=200,white_balance_temperature_auto=1
