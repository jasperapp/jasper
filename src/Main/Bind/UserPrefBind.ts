import fs from 'fs';
import nodePath from 'path';
import {app, BrowserWindow} from 'electron';
import process from 'process';
import os from 'os';
import {UserPrefIPC} from '../../IPC/UserPrefIPC';

const MacSandboxPath = '/Library/Containers/io.jasperapp/data/Library/Application Support/jasper';

class _UserPrefBind {
  async bindIPC(_window: BrowserWindow) {
    UserPrefIPC.onRead(async () => this.read());
    UserPrefIPC.onWrite(async (text) => this.write(text));
    UserPrefIPC.onDeleteRelativeFile(async (relativeFilePath) => this.deleteRelativeFile(relativeFilePath));
    UserPrefIPC.onDelete(async () => this.delete());
    UserPrefBindIPC.onDeleteAllData(async () => this.deleteAllData());
    UserPrefBindIPC.onCleanup(async () => this.cleanup());
    UserPrefBindIPC.onGetAbsoluteFilePath(async (relativeFilePath) => this.getAbsoluteFilePath(relativeFilePath));
    UserPrefBindIPC.onGetEachPaths(async () => this.getEachPaths());
    UserPrefBindIPC.onGetPrefDirPath(async () => this.getPrefDirPath());
    UserPrefBindIPC.onGetPrefPath(async () => this.getPrefPath());
    UserPrefBindIPC.onGetUserDataPath(async () => this.getUserDataPath());
    UserPrefIPC.onDeleteAllData(async () => this.deleteAll
    UserPrefIPC.onCleanup(async () => this.cleanup());

    UserPrefIPC.onGetAbsoluteFilePath(async (relativeFilePath) => this.getAbsoluteFilePath(relativeFilePath));
    UserPrefIPC.onGetEachPaths(async () => this.getEachPaths());
  }

    

  public read(): string {
    const path = this.getPrefPath();
    if (!fs.existsSync(path)) this.write('');

    return fs.readFileSync(path).toString();
  }

  private write(text: string) {
    const path = this.getPrefPath();
    if (!fs.existsSync(path)) {
      const dirPath = this.getPrefDirPath();
      fs.mkdirSync(dirPath, {recursive: true});
    }

    fs.writeFileSync(path, text);
  }

  private delete() {
    const path = this.getPrefPath();
    if (!fs.existsSync(path)) return;
  
    fs.unlinkSync(path);
  
  private cleanup() {
    const path = this.getPrefDirPath();
    if (!fs.existsSync

  private deleteRelativeFile(relativeFilePath: string) {
    const path = this.getAbsoluteFilePath(relativeFilePath);
    if (!path.toLowerCase().includes('jasper')) {
      console.error(`error: path is not Jasper path. path = ${path}`);
      return;
    }

    try {
      fs.unlinkSync(path);
    } catch (e) {
      // ignore
    }
  }

  private getAbsoluteFilePath(relativePath: string): string {
    return nodePath.resolve(nodePath.dirname(this.getPrefPath()), relativePath);
  }

  getEachPaths(): {userDataPath: string; userPrefPath: string} {
    return {
      userDataPath: this.getUserDataPath(),
      userPrefPath: this.getPrefPath(),
    }
  }

  // delete `io.jasperapp/{config.json,main*.db}`
  // todo: fs.rmdirSync with recursive is experimental
  // https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_fs_rmdirsync_path_options
  deleteAllData() {
    try {
      const deletePath = this.getPrefDirPath();
      const basename = nodePath.basename(deletePath);
      if (basename !== 'io.jasperapp') {
        console.error(`error: deletePath is not Jasper path. deletePath = ${deletePath}`);
        return;
      }

      fs.rmdirSync(deletePath, {recursive: true});
      console.log(`deleted: ${deletePath}`);
      return;
    } catch (e) {
      console.error(e);
    }
  }

  // private getAppDataPath(): string {
  //   // mac(no sign): ~/Library/Application Support/jasper
  //   // mac(sign)   : ~/Library/Containers/io.jasperapp/data/Library/Application Support/jasper
  //   // win         : ~\AppData\Roaming\jasper
  //   return app.getPath('appData');
  // }

  private getUserDataPath(): string {
    const userDataPath = app.getPath('userData');

    // hack: Electron v6.0.3にしてから、app-sandboxを指定してcodesignしても、sandboxが有効にならない(原因不明)
    // そのままだとデータのパスが変わってしまうので、非sandboxだけどデータのパスはsandboxのものを使う。
    // 多分Electron側の問題だと思うので、それが直ったらこのhackも消す。
    if (process.env.JASPER === 'DEV') {
      // npm run electronで起動する場合、開発データとして使いたいので非sandboxのパスを使う
      return userDataPath;
    } else if (this.isMac() && !userDataPath.includes(MacSandboxPath)) {
      const homePath = app.getPath('home');
      return `${homePath}${MacSandboxPath}`;
    } else {
      return userDataPath;
    }
  }

  private getPrefDirPath(): string {
    return nodePath.normalize(`${this.getUserDataPath()}/io.jasperapp`);
  }

  private getPrefPath(): string {
    return nodePath.normalize(`${this.getPrefDirPath()}/config.json`);
  }

  private isMac(): boolean {
    return os.platform() === 'darwin';
  }
}

export const UserPrefBind = new _UserPrefBind();
