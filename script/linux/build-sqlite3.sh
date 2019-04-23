#!/bin/bash
cd ./node_modules/sqlite3
npm i nan@2.10.0
npm i node-pre-gyp@0.10.1
npm i -g node-gyp@3.8.0
node-gyp configure --module_name=node_sqlite3 --module_path=../lib/binding/electron-v5.0-linux-x64
node-gyp rebuild --target=5.0.0-beta.9 --arch=x64 --target_platform=linux --dist-url=https://atom.io/download/electron --module_name=node_sqlite3 --module_path=../lib/binding/electron-v5.0-linux-x64
