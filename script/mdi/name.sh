#!/bin/bash
names=$(\
  grep '.mdi-[^:]\+::before' -o ./node_modules/\@mdi/font/css/materialdesignicons.css \
  | cut -d : -f 1 \
  | cut -d - -f 2- \
  | \sed "s/\(.*\)/'\1' |/" \
  | \sed "$ s/|//" \
)

echo "export type IconNameType =
$names
"
