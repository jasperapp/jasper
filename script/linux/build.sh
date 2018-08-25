#!/bin/bash

# cleanup
rm -rf ./out/build

# build js and npm install
./script/build-js.sh

# electron requires electron-vX.Y-linux-x64 of sqlite3
cp -a ./node_modules/sqlite3/lib/binding/electron-v3.0-linux-x64 ./out/js/node_modules/sqlite3/lib/binding/

# build app with electron-packager
VERSION=$(grep version package.json | head -n 1 | cut -f 2 -d : | \sed 's/[",]//g')
./node_modules/.bin/electron-packager ./out/js Jasper \
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

