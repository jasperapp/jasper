// import {ipcMain, ipcRenderer} from 'electron';
//
// enum Channels {
//   deleteAllData = 'DangerIPC:deleteAllData',
// }

class _DangerIPC {
  // async deleteAllData() {
  //   return ipcRenderer.invoke(Channels.deleteAllData);
  // }
  //
  // onDeleteAllData(handler: () => Promise<void>) {
  //   ipcMain.handle(Channels.deleteAllData, handler);
  // }
}

export const DangerIPC = new _DangerIPC();
