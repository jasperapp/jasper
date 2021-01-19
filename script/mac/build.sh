#!/bin/bash

if [ -z $ARCH ]; then
    ARCH=`uname -m`
    if [ $ARCH = "x86_64" ]; then
        ARCH="x64"
    fi
fi

# cleanup
rm -rf ./out/build

# build icon
iconutil -c icns ./misc/logo/jasper.iconset --output ./misc/logo/jasper.icns

# build js and npm install
./script/tsc/build-package.sh

# electron requires electron-vX.Y-darwin-x64 of sqlite3
cp -a ./node_modules/sqlite3/lib/binding/electron-v11.4-darwin-$ARCH ./out/package/node_modules/sqlite3/lib/binding/

# electron v6.0.7から厳密にすべてのnativeコードにcodesignが必要になった
# asar化まえにcodesignする必要があるので、ここで実行する
codesign \
-s "Developer ID Application: Ryo Maruyama (G3Z4F76FBZ)" \
-f \
--options runtime \
--entitlements ./misc/plist/notarization.plist \
./out/package/node_modules/sqlite3/lib/binding/electron-v11.4-darwin-$ARCH/node_sqlite3.node

# build app with electron-packager
VERSION=$(node -e 'console.log(require("./package.json").version)')
./node_modules/.bin/electron-packager ./out/package Jasper \
  --asar \
  --overwrite \
  --darwin-dark-mode-support \
  --icon=./misc/logo/jasper.icns \
  --platform=darwin \
  --arch=$ARCH \
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
mv ./out/build/Jasper-darwin-$ARCH/Jasper.app ./out/mac/

## team id
sed "s/^  <\/dict>/<key>ElectronTeamID<\/key><string>G3Z4F76FBZ<\/string><\/dict>/" ./out/mac/Jasper.app/Contents/Info.plist > ./out/mac/Jasper.app/Contents/Info.plist.tmp
mv ./out/mac/Jasper.app/Contents/Info.plist.tmp ./out/mac/Jasper.app/Contents/Info.plist

# code sign
./script/mac/codesign-developer.sh
