import nodePath from 'path';
import {app} from 'electron';
import {PlatformUtil} from '../Util/PlatformUtil';
import {FS} from './FS';
import {UserPrefEntity} from '../../Renderer/Type/UserPrefEntity';
import path from "path";

const MacSandboxPath = '/Library/Containers/io.jasperapp/data/Library/Application Support/jasper';

class _UsePrefStorage {
  readPrefs(): {prefs?: UserPrefEntity[]; index?: number} {
    if (!FS.exist(this.getPrefPath())) return {};

    const prefs = FS.readJSON<UserPrefEntity[]>(this.getPrefPath());
    return {prefs, index: 0};
  }

  writePrefs(prefs: UserPrefEntity[]) {
    if (!FS.exist(this.getPrefPath())) FS.mkdir(this.getPrefDirPath());

    FS.writeJSON<UserPrefEntity[]>(this.getPrefPath(), prefs);
  }

  deletePref(index: number) {
    const {prefs} = this.readPrefs();
    const dbPath = this.getDBPath(index);
    FS.rm(dbPath);
    prefs.splice(index, 1);
    this.writePrefs(prefs);
  }

  deleteUserData() {
    if (!FS.rmdir(this.getUserDataPath())) {
      FS.rmdir(this.getPrefDirPath());
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

  getPrefDirPath(): string {
    return `${this.getUserDataPath()}/io.jasperapp`;
  }

  getPrefPath(): string {
    return `${this.getPrefDirPath()}/config.json`;
  }

  getDBPath(prefIndex: number): string {
    const {prefs} = this.readPrefs();
    const pref = prefs[prefIndex];
    return nodePath.resolve(path.dirname(this.getPrefPath()), pref.database.path);
  }
}

export const UserPrefStorage = new _UsePrefStorage();
