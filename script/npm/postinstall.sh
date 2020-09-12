#!/bin/bash -x

# styled-componentsによってreact-nativeの型がインストールされてしまう
# しかしこれがTSの組み込み型と競合してエラーになるので削除してしまう
rm -rf node_modules/@types/react-native

# darkreader.jsをファイルとして読み込みたいのでコピーする
cp -f node_modules/darkreader/darkreader.js src/Renderer/Fragment/Browser/BrowserFragmentAsset/

# todo mdiのcssファイルなどもコピーする
