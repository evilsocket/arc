#!/bin/bash

if [ $GOARCH = "arm" ]; then
    export CC=arm-linux-gnueabi-gcc
    env > env.txt
fi
