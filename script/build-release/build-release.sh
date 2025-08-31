#!/bin/bash -x

# -e: 失敗で終了
# -u: 未定義変数をエラー扱い
# -o pipefail: パイプ中のどれかが失敗しても拾う
set -euo pipefail

rm -rf ./out/release ./out/release-app

./script/build-release/esbuild.sh
./script/build-release/electron-packager.sh
