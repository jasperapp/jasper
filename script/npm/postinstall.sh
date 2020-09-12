#!/bin/bash -x

# styled-componentsによってreact-nativeの型がインストールされてしまう
# しかしこれがTSの組み込み型と競合してエラーになるので削除してしまう
rm -rf node_modules/@types/react-native

# darkreader.jsをファイルとして読み込みたいのでコピーする
cp -f node_modules/darkreader/darkreader.js src/Renderer/Fragment/Browser/BrowserFragmentAsset/

# material design icon
mkdir -p src/Renderer/asset/css
mkdir -p src/Renderer/asset/fonts
cp -f node_modules/@mdi/font/materialdesignicons.css src/Renderer/asset/css/
cp -f node_modules/@mdi/font/materialdesignicons.css.map src/Renderer/asset/css/
cp -f node_modules/@mdi/font/materialdesignicons.css.map src/Renderer/asset/css/
cp -f node_modules/@mdi/font/fonts/* src/Renderer/asset/fonts/

# todo mdiのcssファイルなどもコピーする
