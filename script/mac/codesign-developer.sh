#!/usr/bin/env bash

# MASで配布しないアプリはdeveloper certで署名すると、gatekeeperでも開くことが可能になる
# 以下の手順で証明書を作って署名につかう
# https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/MaintainingCertificates/MaintainingCertificates.html#//apple_ref/doc/uid/TP40012582-CH31-SW32

# entitlementsに設定できるkeyはここをみる
# https://developer.apple.com/library/content/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html

# codesignについて手動で行うにはMAS版の方法を参考にする
# https://electronjs.org/docs/tutorial/mac-app-store-submission-guide

# team idやentitlementなどを確認するにはcodesignコマンドを使う
# codesign -vv -d --entitlements :- ./out/mac/Jasper.app

# fixme: electron v6.0.7ではapp-sandboxを有効にできず困っているが、解決策はまだない
# --entitlements, --entitlements-inheritを指定するとcodesign後にjasperが起動しない
# --ignoreを指定すると起動はするがapp-sandboxは有効にならない

export DEBUG=electron-osx-sign*

electron-osx-sign ./out/mac/Jasper.app \
--platform=darwin \
--identity="Developer ID Application: Ryo Maruyama (G3Z4F76FBZ)" \
--type=distribution \
# --entitlements="./misc/plist/parent.plist" \
# --entitlements-inherit="./misc/plist/child.plist" \
# --ignore="Jasper Helper .*" \
# --no-pre-auto-entitlements \
# --no-gatekeeper-assess \
# --hardened-runtime \

# node ./script/mac/notarize.js
# xcrun stapler staple ./out/mac/Jasper.app

