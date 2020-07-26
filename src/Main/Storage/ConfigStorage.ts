import nodePath from 'path';
import {app} from 'electron';
import {PlatformUtil} from '../Util/PlatformUtil';
import {FS} from './FS';
import {ConfigType} from '../../Type/ConfigType';
import path from "path";

const MacSandboxPath = '/Library/Containers/io.jasperapp/data/Library/Application Support/jasper';

class _ConfigStorage {
  readConfigs(): {configs?: ConfigType[]; index?: number} {
    if (!FS.exist(this.getConfigPath())) return {};

    const configs = FS.readJSON<ConfigType[]>(this.getConfigPath());
    return {configs, index: 0};
  }

  writeConfigs(configs: ConfigType[]) {
    if (!FS.exist(this.getConfigPath())) FS.mkdir(this.getConfigDirPath());

    FS.writeJSON<ConfigType[]>(this.getConfigPath(), configs);
  }

  deleteConfig(index: number) {
    const {configs} = this.readConfigs();
    const dbPath = this.getDBPath(index);
    FS.rm(dbPath);
    configs.splice(index, 1);
    this.writeConfigs(configs);
  }

  deleteUserData() {
    if (!FS.rmdir(this.getUserDataPath())) {
      FS.rmdir(this.getConfigDirPath());
    }
  }

  getUserDataPath(): string {
    const userDataPath = app.getPath('userData');

    // hack: Electron v6.0.3にしてから、app-sandboxを指定してcodesignしても、sandboxが有効にならない(原因不明)
    // そのままだとデータのパスが変わってしまうので、非sandboxだけどデータのパスはsandboxのものを使う。
    // 多分Electron側の問題だと思うので、それが直ったらこのhackも消す。
    if (process.env.JASPER === 'DEV') {
      // npm run electronで起動する場合、開発データとして使いたいので非sandboxのパスを使う
      return userDataPath;
    } else if (PlatformUtil.isMac() && !userDataPath.includes(MacSandboxPath)) {
      const homePath = app.getPath('home');
      return `${homePath}${MacSandboxPath}`;
    } else {
      return userDataPath;
    }
  }

  getConfigDirPath(): string {
    return `${this.getUserDataPath()}/io.jasperapp`;
  }

  getConfigPath(): string {
    return `${this.getConfigDirPath()}/config.json`;
  }

  getDBPath(configIndex: number): string {
    const {configs} = this.readConfigs();
    const config = configs[configIndex];
    return nodePath.resolve(path.dirname(this.getConfigPath()), config.database.path);
  }
}

export const ConfigStorage = new _ConfigStorage();
