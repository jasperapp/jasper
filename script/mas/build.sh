#!/bin/bash

# cleanup
rm -rf ./out/build
rm -rf ./out/mas

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
  --app-copyright=RyoMaruyama

# build app with mas
MAS_ELECTRON_APP="./misc/mas/electron-v1.4.2-mas-x64/Electron.app"
NO_SIGN_APP="./out/build/Jasper-darwin-x64/Jasper.app"
SIGN_APP="./out/mas/Jasper.app"

mkdir -p ./out/mas

# exec
cp -a $MAS_ELECTRON_APP $SIGN_APP
mv $SIGN_APP/Contents/MacOS/{Electron,Jasper}

# resource
cp -a $NO_SIGN_APP/Contents/Info.plist              $SIGN_APP/Contents/
cp -a $NO_SIGN_APP/Contents/Resources/electron.icns $SIGN_APP/Contents/Resources/
cp -a $NO_SIGN_APP/Contents/Resources/app.asar      $SIGN_APP/Contents/Resources/

# helper
mv $SIGN_APP/Contents/Frameworks/Electron\ Helper.app/Contents/MacOS/{Electron\ Helper,Jasper\ Helper}
mv $SIGN_APP/Contents/Frameworks/{Electron\ Helper.app,Jasper\ Helper.app}
cp -a "$NO_SIGN_APP/Contents/Frameworks/Jasper Helper.app/Contents/Info.plist" "$SIGN_APP/Contents/Frameworks/Jasper Helper.app/Contents/"

# helper eh
mv $SIGN_APP/Contents/Frameworks/Electron\ Helper\ EH.app/Contents/MacOS/{Electron\ Helper\ EH,Jasper\ Helper\ EH}
mv $SIGN_APP/Contents/Frameworks/{Electron\ Helper\ EH.app,Jasper\ Helper\ EH.app}
cp -a "$NO_SIGN_APP/Contents/Frameworks/Jasper Helper EH.app/Contents/Info.plist" "$SIGN_APP/Contents/Frameworks/Jasper Helper EH.app/Contents/"

# helper np
mv $SIGN_APP/Contents/Frameworks/Electron\ Helper\ NP.app/Contents/MacOS/{Electron\ Helper\ NP,Jasper\ Helper\ NP}
mv $SIGN_APP/Contents/Frameworks/{Electron\ Helper\ NP.app,Jasper\ Helper\ NP.app}
cp -a "$NO_SIGN_APP/Contents/Frameworks/Jasper Helper NP.app/Contents/Info.plist" "$SIGN_APP/Contents/Frameworks/Jasper Helper NP.app/Contents/"

# team id
sed "s/<\/dict>/<key>ElectronTeamID<\/key><string>G3Z4F76FBZ<\/string><\/dict>/" $SIGN_APP/Contents/Info.plist > $SIGN_APP/Contents/Info.plist.tmp
mv $SIGN_APP/Contents/Info.plist.tmp $SIGN_APP/Contents/Info.plist

./script/mas/codesign-app.sh

