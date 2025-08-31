#!/bin/bash -x

# -e: 失敗で終了
# -u: 未定義変数をエラー扱い
# -o pipefail: パイプ中のどれかが失敗しても拾う
set -euo pipefail

# コードサイン
# electron v6.0.7から厳密にすべてのnativeコードにcodesignが必要になった
# asar化まえにcodesignする必要があるので、ここで実行する
codesign \
-s "Developer ID Application: Ryo Maruyama (G3Z4F76FBZ)" \
-f \
--options runtime \
--entitlements ./misc/plist/notarization.plist \
./out/release/node_modules/sqlite3/lib/binding/napi-v6-darwin-unknown-arm64/node_sqlite3.node

# アイコンをビルド
iconutil -c icns ./misc/logo/jasper.iconset --output ./misc/logo/jasper.icns

# バージョンを取得
VERSION=$(node -e 'console.log(require("./package.json").version)')

# notarize用のID/Passwordを取得
APPLE_ID=$(node -e 'console.log(require(`${process.env.HOME}/.apple/notarize-account.json`).id)')
APPLE_PASSWORD=$(node -e 'console.log(require(`${process.env.HOME}/.apple/notarize-account.json`).password)')

# electron-packagerでビルド
rm -rf ./out/release-pp
export DEBUG="electron-osx-sign* electron-packager* electron-notarize*"
npx @electron/packager ./out/release Jasper \
  --asar \
  --overwrite \
  --icon=./misc/logo/jasper.icns \
  --platform=darwin \
  --arch=arm64 \
  --out=./out/release-app \
  --app-bundle-id=io.jasperapp \
  --helper-bundle-id=io.jasperapp.helper \
  --app-version="$VERSION" \
  --build-version="$VERSION" \
  --protocol=jasperapp \
  --protocol-name=jasperapp-protocol \
  --app-copyright=RyoMaruyama \
  --osx-sign.identity="Developer ID Application: Ryo Maruyama (G3Z4F76FBZ)" \
  --osx-sign.type=distribution \
  --osx-sign.hardenedRuntime=true \
  --osx-sign.entitlements="./misc/plist/notarization.plist" \
  --osx-sign.entitlements-inherit="./misc/plist/notarization.plist" \
  --osx-notarize.appleId="$APPLE_ID" \
  --osx-notarize.appleIdPassword="$APPLE_PASSWORD" \
  --osx-notarize.teamId="G3Z4F76FBZ" \

# ------------------------------------------
# code sign, notarize関連のリンク
# ------------------------------------------
# MASで配布しないアプリはdeveloper certで署名すると、gatekeeperでも開くことが可能になる
# 以下の手順で証明書を作って署名につかう
#   https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/MaintainingCertificates/MaintainingCertificates.html#//apple_ref/doc/uid/TP40012582-CH31-SW32
#
# entitlementsに設定できるkeyはここをみる
#   https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html
#
# codesignについて手動で行うにはMAS版の方法を参考にする
#   https://electronjs.org/docs/tutorial/mac-app-store-submission-guide
#
# notarizeのチケットを添付する
#   https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/
#   https://uechi.io/blog/sign-and-notarize-electron-app
#   https://developer.apple.com/documentation/security/notarizing_your_app_before_distribution/customizing_the_notarization_workflow#3087720
