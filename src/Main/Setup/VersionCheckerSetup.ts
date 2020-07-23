import semver from 'semver';
import {app} from 'electron';
import https from 'https';
import Logger from 'color-logger';
import {Timer} from '../../Util/Timer';
import {Platform} from '../../Util/Platform';
import {AppWindow} from '../AppWindow';

class _VersionCheckerSetup {
  private _runningIds: number[] = [];

  exec() {
    this.execInner();
  }

  private async execInner() {
    this._runningIds = [];
    const runningId = Date.now();
    this._runningIds.push(runningId);

    while(1) {
      if (!this._runningIds.includes(runningId)) return;

      const latestVersion = await this.check();
      if (latestVersion) {
        AppWindow.getWindow().webContents.send('update-version', latestVersion);
      }
      await Timer.sleep(3600 * 1000);
    }
  }

  private async check() {
    try {
      const currentVersion = app.getVersion();
      const versions = await this._fetchVersions();
      const latestVersion = this._getInterestedVersion(versions);
      if (semver.gt(latestVersion.version, currentVersion)) {
        return latestVersion;
      }
    } catch (e) {
      Logger.e(e.message || e);
    }
  }

  private _getInterestedVersion(versions) {
    for (const item of versions) {
      // only release version, skip pre-release(alpha, beta, rc) version
      // todo: configurable this behavior
      if (semver.parse(item.version).prerelease.length === 0) return item;
    }
  }

  private _fetchVersions() {
    return new Promise((resolve, reject)=>{

      let url;
      if (Platform.isMac()) {
        url = 'https://jasperapp.io/-/versions-mac.json';
      } else if (Platform.isWin()) {
        url = 'https://jasperapp.io/-/versions-windows.json';
      } else if (Platform.isLinux()) {
        url = 'https://jasperapp.io/-/versions-linux.json';
      } else {
        reject(new Error(`unknown platform: ${Platform.name()}`));
        return;
      }

      https.get(url, (res) => {
        const statusCode = res.statusCode;
        let body = '';
        res.on('data', (chunk) => body += chunk.toString());

        res.on('end', ()=> {
          if (statusCode !== 200) {
            reject(new Error(body));
            return;
          }

          try {
            body = JSON.parse(body);
            resolve(body);
          } catch (e) {
            reject(new Error(body));
          }
        });

      }).on('error', (e) => {
        console.error(e);
        reject(e);
      });
    });
  }
}

export const VersionCheckerSetup = new _VersionCheckerSetup();
