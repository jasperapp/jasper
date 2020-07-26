// import {ipcMain, ipcRenderer} from 'electron';
//
// enum Channels {
//   exec = 'ConnectionCheckIPC:exec',
// }

class _ConnectionCheckIPC {
  // async exec(webHost: string, https: boolean) {
  //   return ipcRenderer.invoke(Channels.exec, webHost, https);
  // }
  //
  // onExec(handler: (_ev, webHost: string, https: boolean) => Promise<void>) {
  //   ipcMain.handle(Channels.exec, handler);
  // }
}

export const ConnectionCheckIPC = new _ConnectionCheckIPC();
