import semver from 'semver';
import {TimerUtil} from '../../Library/Util/TimerUtil';
import {UserAgentUtil} from '../../Library/Util/UserAgentUtil';
import {VersionEvent} from '../../Event/VersionEvent';
import {RemoteVersionEntity} from '../../Library/Type/RemoteVersionEntity';

class _VersionPolling {
  private execId: number;

  getVersion(): string {
    const matched = navigator.userAgent.match(/Jasper\/([^ ]+)/);
    if (!matched) {
      console.error(`can not take version from user agent.`, navigator.userAgent);
      return '0.0.0';
    }

    const version = matched[0].split('/')[1].trim();
    return version;
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

  private getInterestedVersion(versions: RemoteVersionEntity[]): RemoteVersionEntity {
    for (const item of versions) {
      // only release version, skip pre-release(alpha, beta, rc) version
      // todo: configurable this behavior
      if (semver.parse(item.version).prerelease.length === 0) return item;
    }
  }

  private async fetchVersions(): Promise<{error?: Error; versions?: RemoteVersionEntity[]}> {
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

export const VersionPolling = new _VersionPolling();
