import semver from 'semver';
import {TimerUtil} from '../Util/TimerUtil';
import {UserAgentUtil} from '../Util/UserAgentUtil';
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
      await TimerUtil.sleep(3600 * 1000);
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
    if (UserAgentUtil.isMac()) {
      url = 'https://jasperapp.io/-/versions-mac.json';
    } else if (UserAgentUtil.isWin()) {
      url = 'https://jasperapp.io/-/versions-windows.json';
    } else if (UserAgentUtil.isLinux()) {
      url = 'https://jasperapp.io/-/versions-linux.json';
    } else {
      return {error: new Error(`VersionChecker: unknown platform. user agent = ${navigator.userAgent}`)};
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
