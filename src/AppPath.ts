import {app} from 'electron';
import {Platform} from './Util/Platform';

const pathOfMacSandbox = '/Library/Containers/io.jasperapp/data/Library/Application Support/jasper';

class _AppPath {
  getUserData(): string {
    const userDataPath = app.getPath('userData');

    // hack: Electron v6.0.3にしてから、app-sandboxを指定してcodesignしても、sandboxが有効にならない(原因不明)
    // そのままだとデータのパスが変わってしまうので、非sandboxだけどデータのパスはsandboxのものを使う。
    // 多分Electron側の問題だと思うので、それが直ったらこのhackも消す。
    if (process.env.JASPER === 'DEV') {
      // npm run electronで起動する場合、開発データとして使いたいので非sandboxのパスを使う
      return userDataPath;
    } else if (Platform.isMac() && !userDataPath.includes(pathOfMacSandbox)) {
      const homePath = app.getPath('home');
      return `${homePath}${pathOfMacSandbox}`;
    } else {
      return userDataPath;
    }
  }
}

export const AppPath = new _AppPath();
