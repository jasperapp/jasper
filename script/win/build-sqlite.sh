#!/bin/bash

# node-gyp requires https://github.com/nodejs/node-gyp#installation
# pythonをインストールしたら、環境変数の設定
# Windowsマークを右クリック -> システム -> システムの詳細設定 -> 環境変数 -> C:\Python27

cd ./node_modules/sqlite3
npm i nan@2.10.0
npm i node-pre-gyp@0.10.1
npm i -g node-gyp@3.8.0
node-gyp configure  --module_name=node_sqlite3 --module_path=../lib/binding/electron-v3.1-win32-x64
node-gyp rebuild  --msvs_version=2015 --target=3.1.1 --arch=x64 --target_platform=win32 --dist-url=https://atom.io/download/electron --module_name=node_sqlite3 --module_path=../lib/binding/electron-v3.1-win32-x64
