import {ipcMain, ipcRenderer} from 'electron';
import {ConfigType} from '../Type/ConfigType';

enum Channels {
  exec = 'ConnectionCheckIPC:exec',
}

class _ConnectionCheckIPC {
  async exec(config: ConfigType) {
    return ipcRenderer.invoke(Channels.exec, config);
  }

  onExec(handler: (_ev, config: ConfigType) => Promise<void>) {
    ipcMain.handle(Channels.exec, handler);
  }
}

export const ConnectionCheckIPC = new _ConnectionCheckIPC();
