#!/usr/bin/env bash

# MASで配布しないアプリはdeveloper certで署名すると、gatekeeperでも開くことが可能になる
# 以下の手順で証明書を作って署名につかう
# https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/MaintainingCertificates/MaintainingCertificates.html#//apple_ref/doc/uid/TP40012582-CH31-SW32
# entitlementsに設定できるkeyはここをみる
# https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html

# codesign -vv -d foo.app でコードサイン情報を色々見れる（team idも見れる）

rm -rf ./out/mac/Jasper.pkg

# Name of your app.
APP="Jasper"
# The path of you app to sign.
APP_PATH="./out/mac/Jasper.app"
# The name of certificates you requested.
APP_KEY="Developer ID Application: Ryo Maruyama (G3Z4F76FBZ)"

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
