#!/bin/bash

# -e: 失敗で終了
# -u: 未定義変数をエラー扱い
# -o pipefail: パイプ中のどれかが失敗しても拾う
set -euo pipefail

# クリーンアップ
rm -rf ./out

# メインプロセスのコードをビルド
npx esbuild src/index.ts --bundle --platform=node --format=cjs --packages=external --outfile=out/src/index.cjs

# mainプロセスで使うアセットをビルド
mkdir -p out/src/Main/asset
cp -a src/Main/asset/* out/src/Main/asset/
npx esbuild src/Main/asset/js/*.ts --bundle --platform=browser --format=esm --outdir=out/src/Main/asset/js/

# プリロードのコードをビルド
npx esbuild src/Renderer/Preload/*.ts --bundle --platform=node --format=cjs --packages=external --outdir=out/src/Renderer/Preload/

# レンダラープロセスのコードをビルド
npx esbuild src/Renderer/Fragment/*.tsx --bundle --platform=browser --format=esm --outdir=out/src/Renderer/Fragment

# レンダラープロセスで使うアセットをビルド
mkdir -p out/src/Renderer/asset
cp -a src/Renderer/asset/* out/src/Renderer/asset/
npx esbuild src/Renderer/asset/BrowserFragmentAsset/*.ts --bundle --platform=browser --format=esm --outdir=out/src/Renderer/asset/BrowserFragmentAsset/
