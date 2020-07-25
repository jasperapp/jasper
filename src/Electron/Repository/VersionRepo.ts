import semver from 'semver';
import {Timer} from '../../Util/Timer';
import {Platform} from '../../Util/Platform';
import {VersionEvent} from '../Event/VersionEvent';

export type VersionType = {
  version: string;
  url: string;
}

class _VersionRepo {
  private execId: number;

  getVersion(): string {
    return navigator.userAgent.split(' ')[0]?.split('/')[1];
  }

  startChecker() {
    this.exec();
  }

  stopChecker() {
    this.execId = null;
  }

  private async exec() {
    const execId = this.execId = Date.now();

    while(1) {
      if (!this.execId) return;
      if (this.execId !== execId) return;

      const latestVersion = await this.check();
      if (latestVersion) {
        VersionEvent.emitNewVersion(latestVersion);
      }
      await Timer.sleep(3600 * 1000);
    }
  }

  private async check() {
    const {error, versions} = await this.fetchVersions();
    if (error) {
      console.error(error);
      return;
    }

    const currentVersion = this.getVersion();
    const latestVersion = this.getInterestedVersion(versions);
    if (semver.gt(latestVersion.version, currentVersion)) {
      return latestVersion;
    }
  }

  private getInterestedVersion(versions: VersionType[]): VersionType {
    for (const item of versions) {
      // only release version, skip pre-release(alpha, beta, rc) version
      // todo: configurable this behavior
      if (semver.parse(item.version).prerelease.length === 0) return item;
    }
  }

  private async fetchVersions(): Promise<{error?: Error; versions?: VersionType[]}> {
    let url;
    if (Platform.isMac()) {
      url = 'https://jasperapp.io/-/versions-mac.json';
    } else if (Platform.isWin()) {
      url = 'https://jasperapp.io/-/versions-windows.json';
    } else if (Platform.isLinux()) {
      url = 'https://jasperapp.io/-/versions-linux.json';
    } else {
      return {error: new Error(`VersionChecker: unknown platoform. paltform = ${Platform.name()}`)}
    }

    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        const text = await res.text();
        return {error: new Error(text)};
      }

      const versions = await res.json();
      return {versions};
    } catch (e) {
      return {error: e};
    }
  }
}

export const VersionRepo = new _VersionRepo();
