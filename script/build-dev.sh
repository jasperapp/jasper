#!/bin/bash

# -e: 失敗で終了
# -u: 未定義変数をエラー扱い
# -o pipefail: パイプ中のどれかが失敗しても拾う
set -euo pipefail

# クリーンアップ
rm -rf ./out/dev

# メインプロセスのコードをビルド
npx esbuild src/index.ts --bundle --platform=node --format=cjs --packages=external --outfile=out/dev/src/index.cjs

# mainプロセスで使うアセットをビルド
mkdir -p out/dev/src/Main/asset
cp -a src/Main/asset/* out/dev/src/Main/asset/
npx esbuild src/Main/asset/js/*.ts --bundle --platform=browser --format=esm --outdir=out/dev/src/Main/asset/js/

# プリロードのコードをビルド
npx esbuild src/Renderer/Preload/*.ts --bundle --platform=node --format=cjs --packages=external --outdir=out/dev/src/Renderer/Preload/

# レンダラープロセスのコードをビルド
npx esbuild src/Renderer/Fragment/*.tsx --bundle --platform=browser --format=esm --outdir=out/dev/src/Renderer/Fragment

# レンダラープロセスで使うアセットをビルド
mkdir -p out/dev/src/Renderer/asset
cp -a src/Renderer/asset/* out/dev/src/Renderer/asset/
npx esbuild src/Renderer/asset/BrowserFragmentAsset/*.ts --bundle --platform=browser --format=esm --outdir=out/dev/src/Renderer/asset/BrowserFragmentAsset/
