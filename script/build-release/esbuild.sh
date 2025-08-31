#!/bin/bash -x

# -e: 失敗で終了
# -u: 未定義変数をエラー扱い
# -o pipefail: パイプ中のどれかが失敗しても拾う
set -euo pipefail

# コードをビルド
./script/build-dev.sh
rm -rf ./out/release
cp -a ./out/dev ./out/release

# メインプロセスのコードはnode_moduleをバンドルしていないのでインストールする必要がある
cp -a ./package.json ./package-lock.json ./out/release/
# メインプロセスで必要なnode_modulesだけをインストール(todo: もうちょっといいやり方無いかな？)
(cd ./out/release && npm i --omit=dev electron-window-state sqlite3)

# electronのエントリポイントを変更
# `main: out/dev/src/index.cjs`
# ↓
# `main: src/index.cjs`
sed 's#out/dev/src/index.cjs#src/index.cjs#' ./out/release/package.json > ./out/release/package.json.tmp
mv ./out/release/package.json.tmp ./out/release/package.json
