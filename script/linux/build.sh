#!/bin/bash

# cleanup
rm -rf ./out/build

# build js and npm install
./script/tsc/build-package.sh

# electron requires electron-vX.Y-linux-x64 of sqlite3
cp -a ./node_modules/sqlite3/lib/binding/electron-v13.6-linux-x64 ./out/package/node_modules/sqlite3/lib/binding/

# build app with electron-packager
VERSION=$(node -e 'console.log(require("./package.json").version)')
./node_modules/.bin/electron-packager ./out/package Jasper \
  --asar=true \
  --overwrite \
  --platform=linux \
  --arch=x64 \
  --out=./out/build \
  --app-version=$VERSION \
  --build-version=$VERSION \
  --app-copyright=RyoMaruyama

rm -rf ./out/linux
mkdir ./out/linux
mv ./out/build/Jasper-linux-x64 ./out/linux/Jasper

