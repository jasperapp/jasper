#!/bin/bash

# styled-componentsによってreact-nativeの型がインストールされてしまう
# しかしこれがTSの組み込み型と競合してエラーになるので削除してしまう
rm -rf node_modules/@types/react-native

