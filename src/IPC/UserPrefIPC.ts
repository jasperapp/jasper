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

  // read
  async read(): Promise<string> {
    return this.invoke<string>(Channels.read);
  }

  onRead(handler: () => Promise<string>) {
    this.handle(Channels.read, handler);
  }

  // write
  async write(text: string): Promise<void> {
    return this.invoke<void>(Channels.write, text);
  }

  onWrite(handler: (text: string) => Promise<void>) {
    this.handle(Channels.write, handler);
  }

  // delete relative file
  async deleteRelativeFile(relativeFilePath: string): Promise<void> {
    return this.invoke<void>(Channels.deleteRelativeFile, relativeFilePath);
  }

  onDeleteRelativeFile(handler: (relativeFilePath: string) => Promise<void>) {
    this.handle(Channels.deleteRelativeFile, handler);
  }

  // absolute file
  async getAbsoluteFilePath(relativeFilePath: string): Promise<string> {
    return this.invoke<string>(Channels.absoluteFilePath, relativeFilePath);
  }

  onGetAbsoluteFilePath(handler: (relativeFilePath: string) => Promise<string>) {
    this.handle(Channels.absoluteFilePath, handler);
  }

  // each paths
  async getEachPaths(): Promise<{ userDataPath: string; userPrefPath: string }> {
    return this.invoke<{ userDataPath: string; userPrefPath: string }>(Channels.eachPaths);
  }

  onGetEachPaths(handler: () => Promise<{ userDataPath: string; userPrefPath: string }>) {
    this.handle(Channels.eachPaths, handler);
  }
}

export const UserPrefIPC = new _UserPrefIPC();
