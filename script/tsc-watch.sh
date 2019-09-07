#!/bin/bash

rm -rf ./out/src

# css, htmlなどアウトプットに含めるための処理
cp -a ./src ./out/
rm $(find ./out/src -name '*.[jt]s' -or -name '*.[jt]sx')

npx tsc --watch
