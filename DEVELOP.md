# Initialize

```
git clone git@github.com:jasperapp/jasper.git
npm i
```

# Run as Development

```
npm run mac:run
```

# Build Production

```
vi package.json # version
npm run mac:build
open out/mac/Jasper.app
```

# Release
- change `version` in package.json 
- push to GitHub
- add release tag
- build production binary on Mac/Windows/Linux
- update jasperapp.io
  - change version and URL in `indexh.html`
  - change URL in `release.html`
  - add version to `{versions-{mac,windows,linux}.json`
  
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

# Update Electron
- `electron` in package.json
- change electron version in ./script/{mac,win,linux}/build-sqlite.sh
- change sqlite3 version in ./script/{mac,win,linux}/build.sh

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

