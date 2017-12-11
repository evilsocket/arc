#!/bin/bash
env > env.txt
if [ $GOARCH = "arm" ]; then
    export CC=arm-linux-gnueabi-gcc
fi
