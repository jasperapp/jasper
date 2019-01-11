#!/bin/bash

# cleanup
rm -rf ./out/build

# build icon
iconutil -c icns ./misc/logo/jasper.iconset --output ./misc/logo/jasper.icns

# build js and npm install
./script/build-js.sh

# electron requires electron-vX.Y-darwin-x64 of sqlite3
cp -a ./node_modules/sqlite3/lib/binding/electron-v3.1-darwin-x64 ./out/js/node_modules/sqlite3/lib/binding/

# build app with electron-packager
VERSION=$(grep version package.json | head -n 1 | cut -f 2 -d : | \sed 's/[",]//g')
./node_modules/.bin/electron-packager ./out/js Jasper \
  --asar=true \
  --overwrite \
  --icon=./misc/logo/jasper.icns \
  --platform=darwin \
  --arch=x64 \
  --out=./out/build \
  --app-bundle-id=io.jasperapp \
  --helper-bundle-id=io.jasperapp.helper \
  --app-version=$VERSION \
  --build-version=$VERSION \
  --protocol=jasperapp \
  --protocol-name=jasperapp-protocol \
  --app-copyright=RyoMaruyama

rm -rf ./out/mac
mkdir -p ./out/mac
mv ./out/build/Jasper-darwin-x64/Jasper.app ./out/mac/

## team id
sed "s/^  <\/dict>/<key>ElectronTeamID<\/key><string>G3Z4F76FBZ<\/string><\/dict>/" ./out/mac/Jasper.app/Contents/Info.plist > ./out/mac/Jasper.app/Contents/Info.plist.tmp
mv ./out/mac/Jasper.app/Contents/Info.plist.tmp ./out/mac/Jasper.app/Contents/Info.plist

# code sign
./script/mac/codesign-developer.sh

