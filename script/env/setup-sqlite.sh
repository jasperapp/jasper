#!/bin/bash
# sqlite3をビルドするにはDEVELOP.mdをみて環境を整える必要がある
if [ -z $ARCH ]; then
    ARCH=`uname -m`
    if [ $ARCH = "x86_64" ]; then
        ARCH="x64"
    fi
fi
npx electron-rebuild -a $ARCH -f -w sqlite3
