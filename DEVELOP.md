# Development

## ARCHITECTURE.md
https://github.com/jasperapp/jasper/blob/master/ARCHITECTURE.md

## Requirement

Needs Node 10 or 12. `sqlite3@4.1.1` that Jasper depends on doesn't support Node 14.

## Run as Development

```
git clone git@github.com:jasperapp/jasper.git
npm i
npm run env:setup
npm run tsc:watch
npm run mac:run
```

## SQLite3
### Build on Windows
WindowsでSQLite3をelectron-rebuildでビルドするためには`npm i windows-build-tools`でビルドツールをインストールする必要がある

- https://github.com/electron/electron-rebuild#what-are-the-requirements
```
What are the requirements?
Node v10.12.0 or higher is required. Building the native modules from source uses node-gyp, refer to the link for its installation/runtime requirements.
```

- https://github.com/nodejs/node-gyp#installation
```
Option 1
Install all the required tools and configurations using Microsoft's windows-build-tools using npm install --global windows-build-tools from an elevated PowerShell or CMD.exe (run as Administrator).
```

- https://github.com/felixrieseberg/windows-build-tools
```
npm install --global windows-build-tools
```

### Build on Linux
Linux(Ubuntu20.04)でビルドするためには以下のパッケージが必要
```
apt-get install python make gcc g++
```

## Build Production

```
vi package.json # version
npm run mac:build
open out/mac/Jasper.app
```

# Release
- change `version` in package.json 
- build production binary on Mac/Windows/Linux
- upload to DropBox
- upload to GitHub Releases
- update jasperapp.io
  - change version and URL in `indexh.html`
  - change URL in `release.html`
  - add the version to `{versions-{mac,windows,linux}.json`
  
# Update Electron
- `electron` in package.json
- change electron version in `/script/{mac,win,linux}/build-sqlite.sh`
- change sqlite3 version in `/script/{mac,win,linux}/build.sh`

# Icon Cache
```
# application icon
sudo find /private/var/folders/ -name '*icon*' # and remove those
sudo rm -rf /Library/Caches/com.apple.iconservices.store
killall Dock
touch Jasper.app
touch Jasper.app/Contents/Info.plist

# notification icon
cd `getconf DARWIN_USER_DIR`/com.apple.notificationcenter/db
sqlite3 ./db
```

- https://gist.github.com/fabiofl/5873100
- http://stackoverflow.com/questions/11856766/osx-notification-center-icon

# Mac App Store Information
- Sign up Mac Developer Program
  - https://developer.apple.com/account/
- Get certification (`Mac App Distribution`, `Mac Installer Distribution` )
  - https://developer.apple.com/account/mac/certificate/
  - https://github.com/nwjs/nw.js/wiki/MAS%3A-Requesting-certificates
  - https://www.apple.com/certificateauthority/
- Get app id
  - https://developer.apple.com/account/mac/identifier/bundle
  - https://github.com/nwjs/nw.js/wiki/MAS:-Registering-a-new-app-on-the-MAS
- Register app
  - https://itunesconnect.apple.com/WebObjects/iTunesConnect.woa/ra/ng/app
- Upload app
  - [Build Production](#build-production)

