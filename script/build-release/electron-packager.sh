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


# build icon
iconutil -c icns ./misc/logo/jasper.iconset --output ./misc/logo/jasper.icns

# バージョンを取得
VERSION=$(node -e 'console.log(require("./package.json").version)')

# electron-packagerでビルド
rm -rf ./out/release-pp
npx electron-packager ./out/release Jasper \
  --asar \
  --overwrite \
  --darwin-dark-mode-support \
  --icon=./misc/logo/jasper.icns \
  --platform=darwin \
  --arch=arm64 \
  --out=./out/release-app \
  --app-bundle-id=io.jasperapp \
  --helper-bundle-id=io.jasperapp.helper \
  --app-version=$VERSION \
  --build-version=$VERSION \
  --protocol=jasperapp \
  --protocol-name=jasperapp-protocol \
  --app-copyright=RyoMaruyama

# `/out/release-app/Jasper.app` へ移動
mv ./out/release-app/Jasper-darwin-arm64/Jasper.app ./out/release-app/
rm -rf ./out/release-app/Jasper-darwin-arm64

# team idを追加（なくても問題なさそうだけど一応）
sed "s/^  <\/dict>/<key>ElectronTeamID<\/key><string>G3Z4F76FBZ<\/string><\/dict>/" ./out/release-app/Jasper.app/Contents/Info.plist > ./out/release-app/Jasper.app/Contents/Info.plist.tmp
mv ./out/release-app/Jasper.app/Contents/Info.plist.tmp ./out/release-app/Jasper.app/Contents/Info.plist
