#!/bin/bash

# copy css, fonts
mkdir -p ./src/Renderer/asset/css
mkdir -p ./src/Renderer/asset/fonts
cp -f ./node_modules/@mdi/font/css/materialdesignicons.css ./src/Renderer/asset/css/
cp -f ./node_modules/@mdi/font/css/materialdesignicons.css.map ./src/Renderer/asset/css/
cp -f ./node_modules/@mdi/font/fonts/* ./src/Renderer/asset/fonts/

# make IconNameType.ts
names=$(\
  grep '.mdi-[^:]\+::before' -o ./node_modules/\@mdi/font/css/materialdesignicons.css \
  | cut -d : -f 1 \
  | cut -d - -f 2- \
  | \sed "s/\(.*\)/'\1' |/" \
  | \sed "$ s/|//" \
)

echo "export type IconNameType =
$names
" > ./src/Renderer/Library/Type/IconNameType.ts
