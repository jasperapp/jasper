#!/bin/bash

# css, htmlなどアウトプットに含めるための処理
cp -a ./src ./out/
rm $(find ./out/src -name '*.[jt]s')

npx tsc --watch
