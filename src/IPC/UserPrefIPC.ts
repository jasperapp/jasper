import { ipcMain, ipcRenderer } from 'electron';

enum Channels {
  read = 'UserPrefIPC:read',
  write = 'UserPrefIPC:write',
  deleteRelativeFile = 'UserPrefIPC:deleteRelativeFile',
  absoluteFilePath = 'UserPrefIPC:absoluteFilePath',
  eachPaths = 'UserPrefIPC:eachPaths',
}

class _UserPrefIPC {
  private async invoke<T>(channel: Channels, ...args: any[]): Promise<T> {
    return ipcRenderer.invoke(channel, ...args);
  }

  private handle<T>(channel: Channels, handler: (...args: any[]) => Promise<T>) {
    ipcMain.handle(channel, (_ev, ...args) => handler(...args));
  }

  // Generic method to create IPC methods
  private createIpcMethod<T>(channel: Channels) {
    return {
      invoke: (...args: any[]) => this.invoke<T>(channel, ...args),
      handle: (handler: (...args: any[]) => Promise<T>) => this.handle(channel, handler),
    };
  }

  // read
  read = this.createIpcMethod<string>(Channels.read).invoke;
  onRead = this.createIpcMethod<string>(Channels.read).handle;

  // write
  write = this.createIpcMethod<void>(Channels.write).invoke;
  onWrite = this.createIpcMethod<void>(Channels.write).handle;

  // delete relative file
  deleteRelativeFile = this.createIpcMethod<void>(Channels.deleteRelativeFile).invoke;
  onDeleteRelativeFile = this.createIpcMethod<void>(Channels.deleteRelativeFile).handle;

  // absolute file
  getAbsoluteFilePath = this.createIpcMethod<string>(Channels.absoluteFilePath).invoke;
  onGetAbsoluteFilePath = this.createIpcMethod<string>(Channels.absoluteFilePath).handle;

  // each paths
  getEachPaths = this.createIpcMethod<{ userDataPath: string; userPrefPath: string }>(Channels.eachPaths).invoke;
  onGetEachPaths = this.createIpcMethod<{ userDataPath: string; userPrefPath: string }>(Channels.eachPaths).handle;
}

export const UserPrefIPC = new _UserPrefIPC();
