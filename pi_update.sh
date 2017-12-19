#!/bin/bash
# nothing to see here, just a utility i use to update my RPi ^_^
bold=$(tput bold)
norm=$(tput sgr0)

FOR_OS=linux
FOR_ARCH=armv6
REL_URL=https://github.com/evilsocket/arc/releases/latest
DEST_PATH=/home/pi/

echo "@ Checking latest available release ..."
LATEST=`curl -sS -I "$REL_URL" | grep "Location:" | cut -d '/' -f8 | tr -d "\r\n"`
LATEST_CLEAN=`echo $LATEST | tr -d v`

while true; do
    read -p "@ Latest release is ${bold}$LATEST${norm}, upgrade? [y/N] " yn
    case $yn in
        [Yy]* ) break;;
        * ) exit 0;;
    esac
done

ARCHIVE_FILE="arc_${LATEST_CLEAN}_${FOR_OS}_${FOR_ARCH}.tar.gz"
CHECKSUMS_FILE="arc_${LATEST_CLEAN}_checksums.txt"
ARCHIVE_URL="https://github.com/evilsocket/arc/releases/download/$LATEST/$ARCHIVE_FILE"
CHECKSUMS_URL="https://github.com/evilsocket/arc/releases/download/$LATEST/$CHECKSUMS_FILE"

cd /tmp/

if [ ! -f $ARCHIVE_FILE ]; then 
    echo "@ Downloading $ARCHIVE_URL to /tmp/ ..."
    curl -L -sS -O $ARCHIVE_URL 
else
    echo "@ Found file $ARCHIVE_FILE"
fi

if [ ! -f $CHECKSUMS_FILE ]; then
    echo "@ Downloading $CHECKSUMS_URL to /tmp/ ..."
    curl -L -sS -O $CHECKSUMS_URL 
else
    echo "@ Found file $CHECKSUMS_FILE"
fi

echo "@ Verifying checksum ..."

VERIFICATION=$(sha256sum --ignore-missing -c $CHECKSUMS_FILE 2>&1)
if [[ $VERIFICATION == *"FAILED"* ]]; then
    echo "${bold}$VERIFICATION${norm}"
    exit 1

elif [[ $VERIFICATION == *"OK"* ]]; then
    echo "@ Verification succesful."

else
    echo $VERIFICATION
    exit 1
fi

echo "@ Extracting to $DEST_PATH ..."
tar -zxf $ARCHIVE_FILE -C $DEST_PATH

cd - &>/dev/null

echo "@ Stopping arcd ..."
sudo killall -9 arcd &>/dev/null

echo "@ Restarting ..."
rm -rf $DEST_PATH/*.log
sudo setcap 'cap_net_bind_service=+ep' $DEST_PATH/arcd

sudo /etc/rc.local

echo "@ Done."
