import process from 'process';
import {PlatformUtil} from '../Util/PlatformUtil';
import nodePath from "path";
import {app} from 'electron';

const MacSandboxPath = '/Library/Containers/io.jasperapp/data/Library/Application Support/jasper';

class _AppPathBind {
  // deleteUserData() {
  //   if (!FS.rmdir(this.getUserDataPath())) {
  //     FS.rmdir(this.getPrefDirPath());
  //   }
  // }

  getAppDataPath(): string {
    // mac(no sign): ~/Library/Application Support/jasper
    // mac(sign)   : ~/Library/Containers/io.jasperapp/data/Library/Application Support/jasper
    // win         : ~\AppData\Roaming\jasper
    return app.getPath('appData');
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

  getAbsPath(targetPath: string, currentFilePath: string): string {
    return nodePath.resolve(nodePath.dirname(currentFilePath), targetPath);
  }
}

export const AppPathBind = new _AppPathBind();
