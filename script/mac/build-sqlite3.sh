#!/bin/bash
cd ./node_modules/sqlite3
npm i nan@2.3.3
npm i node-pre-gyp@0.6.28
npm i -g node-gyp@3.3.1
node-gyp configure  --module_name=node_sqlite3 --module_path=../lib/binding/electron-v1.8-darwin-x64
node-gyp rebuild  --target=1.8.2 --arch=x64 --target_platform=darwin --dist-url=https://atom.io/download/electron --module_name=node_sqlite3 --module_path=../lib/binding/electron-v1.8-darwin-x64
