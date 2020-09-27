#!/bin/bash

# cleanup
rm -rf ./out/package
mkdir -p ./out/package

# css, htmlなどアウトプットに含めるための処理
cp -a ./src ./out/package/
rm $(find ./out/package/src -name '*.ts' -or -name '*.tsx')

# compile
echo tsc...
npx tsc --outDir ./out/package/src/ --sourceMap false

# npm
cp -a ./package.json ./package-lock.json ./script ./out/package/
(cd ./out/package/ && npm i --production)

# styled-componentsが@types/react-nativeを要求しているので、個別に入れておく(npm i --productionでは入らないため)
# todo: styled-components@5.2.xでは直ってるかも？
(cd ./out/package/ && npm i @types/react-native)

# change 'main: out/src/index.js' to 'main: src/index.js' for electron entry path
sed 's#out/src/index.js#src/index.js#' ./out/package/package.json > ./out/package/package.json.tmp
mv ./out/package/package.json.tmp ./out/package/package.json
