#!/bin/bash
env > env.txt
if [ $GOARCH = "arm" ]; then
    echo "ok" > ok.txt
    export CC=arm-linux-gnueabi-gcc
fi
