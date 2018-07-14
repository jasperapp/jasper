#!/bin/bash
# babel
mkdir -p ./out
rm -rf ./out/js
mkdir -p ./out/js
cp -a ./src ./out/js/
./node_modules/.bin/babel --out-dir ./out/js/src ./src

# npm
cp -a ./package.json ./out/js/
(cd ./out/js/ && npm i --production)
