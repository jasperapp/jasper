#!/bin/bash
cd ./node_modules/sqlite3
npm i nan@2.14.0
npm i node-pre-gyp@0.10.1
npm i -g node-gyp@3.8.0
node-gyp configure --module_name=node_sqlite3 --module_path=../lib/binding/electron-v7.1-darwin-x64
node-gyp rebuild --target=7.1.8 --arch=x64 --target_platform=darwin --dist-url=https://atom.io/download/electron --module_name=node_sqlite3 --module_path=../lib/binding/electron-v7.1-darwin-x64
