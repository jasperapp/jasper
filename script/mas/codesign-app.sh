#!/usr/bin/env bash

rm -rf ./out/mas/Jasper.pkg

# Name of your app.
APP="Jasper"
# The path of you app to sign.
APP_PATH="./out/mas/Jasper.app"
# The path to the location you want to put the signed package.
RESULT_PATH="./out/mas/$APP.pkg"
# The name of certificates you requested.
APP_KEY="3rd Party Mac Developer Application: Ryo Maruyama (G3Z4F76FBZ)"
INSTALLER_KEY="3rd Party Mac Developer Installer: Ryo Maruyama (G3Z4F76FBZ)"

FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"

codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Versions/A/Electron Framework"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework/Versions/A/Libraries/libnode.dylib"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/Electron Framework.framework"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/Mantle.framework"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/ReactiveCocoa.framework"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/Squirrel.framework"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/$APP Helper.app/Contents/MacOS/$APP Helper"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/$APP Helper.app/"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/$APP Helper EH.app/Contents/MacOS/$APP Helper EH"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/$APP Helper EH.app/"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/$APP Helper NP.app/Contents/MacOS/$APP Helper NP"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$FRAMEWORKS_PATH/$APP Helper NP.app/"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/child.plist "$APP_PATH/Contents/MacOS/$APP"
codesign -s "$APP_KEY" -f --entitlements ./misc/plist/parent.plist "$APP_PATH"

productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_KEY" "$RESULT_PATH"
