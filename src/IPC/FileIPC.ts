// import {ipcMain, ipcRenderer} from 'electron';

// enum Channels {
//   writeJSON = 'writeJSON',
//   removeFile = 'removeFile',
// }

class _FileIPC {
  // // write json
  // async writeJSON<T>(path: string, value: T): Promise<void> {
  //   return ipcRenderer.invoke(Channels.writeJSON, path, value);
  // }
  //
  // async onWriteJSON<T>(handler: (_ev, path: string, value: T) => Promise<void>) {
  //   return ipcMain.handle(Channels.writeJSON, handler);
  // }
  //
  // // remove file
  // async removeFile(path: string): Promise<void> {
  //   return ipcRenderer.invoke(Channels.removeFile, path);
  // }
  //
  // async onRemoveFile(handler: (_ev, path: string) => Promise<void>) {
  //   return ipcMain.handle(Channels.removeFile, handler);
  // }
}

export const FileIPC = new _FileIPC();
