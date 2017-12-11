#!/bin/bash

if [ $GOARCH = "arm" ]; then
    export CGO_ENABLED=1
    export CC=arm-linux-gnueabi-gcc
    env > env.txt
fi
