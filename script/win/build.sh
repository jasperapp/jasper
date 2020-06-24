#!/bin/bash

# cleanup
rm -rf ./out/build

# build js and npm install
./script/tsc/build-package.sh

# electron requires electron-vX.Y-win32-x64 of sqlite3
cp -a ./node_modules/sqlite3/lib/binding/electron-v7.1-win32-x64 ./out/package/node_modules/sqlite3/lib/binding/

# build app with electron-packager
VERSION=$(grep version package.json | head -n 1 | cut -f 2 -d : | \sed 's/[",]//g')
./node_modules/.bin/electron-packager ./out/package Jasper \
  --asar=true \
  --overwrite \
  --icon=./misc/logo/icon_256x256.ico \
  --platform=win32 \
  --arch=x64 \
  --out=./out/build \
  --app-version=$VERSION \
  --build-version=$VERSION \
  --app-copyright=RyoMaruyama

rm -rf ./out/win
mkdir -p ./out/win
mv ./out/build/Jasper-win32-x64 ./out/win/Jasper
