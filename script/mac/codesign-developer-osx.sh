#!/usr/bin/env bash

export DEBUG=electron-osx-sign*

electron-osx-sign ./out/mac/Jasper.app \
--platform=darwin \
--identity="Developer ID Application: Ryo Maruyama (G3Z4F76FBZ)" \
--type=distribution \
# --entitlements="./misc/plist/parent.plist" \
# --entitlements-inherit="./misc/plist/child.plist" \
# --no-pre-auto-entitlements \
# --ignore="Jasper Helper .*" \
# --no-gatekeeper-assess \
# --hardened-runtime \

# node ./script/mac/after-sign-mac.js
