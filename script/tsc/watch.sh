#!/bin/bash

# cleanup
rm -rf ./out/src
mkdir -p ./out

# css, htmlなどアウトプットに含めるための処理
cp -a ./src ./out/
rm $(find ./out/src -name '*.ts' -or -name '*.tsx')

npx tsc --watch
