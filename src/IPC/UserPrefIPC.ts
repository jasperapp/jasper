import {ipcMain, ipcRenderer} from 'electron';

enum Channels {
  read = 'UserPrefIPC:read',
  write = 'UserPrefIPC:write',
  deleteRelativeFile = 'UserPrefIPC:deleteRelativeFile',
  absoluteFilePath = 'UserPrefIPC:absoluteFilePath',
  eachPaths = 'UserPrefIPC:eachPaths',
}

class _UserPrefIPC {
  // read
  async read(): Promise<string> {
    return ipcRenderer.invoke(Channels.read);
  }

  onRead(handler: () => Promise<string>) {
    ipcMain.handle(Channels.read, handler);
  }

  // write
  async write(text: string): Promise<void> {
    return ipcRenderer.invoke(Channels.write, text);
  }

  onWrite(handler: (text: string) => Promise<void>) {
    ipcMain.handle(Channels.write, (_ev, text) => handler(text));
  }

  // delete relative file
  async deleteRelativeFile(relativeFilePath: string): Promise<void> {
    return ipcRenderer.invoke(Channels.deleteRelativeFile, relativeFilePath);
  }

  onDeleteRelativeFile(handler: (relativeFilePath: string) => Promise<void>) {
    ipcMain.handle(Channels.deleteRelativeFile, (_ev, relativeFilePath) => handler(relativeFilePath));
  }

  // absolute file
  async getAbsoluteFilePath(relativeFilePath: string): Promise<string> {
    return ipcRenderer.invoke(Channels.absoluteFilePath, relativeFilePath);
  }

  onGetAbsoluteFilePath(handler: (relativeFilePath: string) => Promise<string>) {
    ipcMain.handle(Channels.absoluteFilePath, (_ev, relativeFilePath) => handler(relativeFilePath));
  }

  // each paths
  async getEachPaths(): Promise<{userDataPath: string; userPrefPath: string}> {
    return ipcRenderer.invoke(Channels.eachPaths);
  }

  onGetEachPaths(handler: () => Promise<{userDataPath: string; userPrefPath: string}>) {
    ipcMain.handle(Channels.eachPaths, (_ev) => handler());
  }
}

export const UserPrefIPC = new _UserPrefIPC();
