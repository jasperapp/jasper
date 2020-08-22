import {ipcMain, ipcRenderer} from 'electron';

enum Channels {
  exist = 'FSIPC:exist',
  mkdir = 'FSIPC:mkdir',
  rmdir = 'FSIPC:rmdir',
  rm = 'FSIPC:rm',
  write = 'FSIPC:write',
  read = 'FSIPC:read',
}

class _FSIPC {
  // exist
  async exist(path: string): Promise<boolean> {
    return ipcRenderer.invoke(Channels.exist, path);
  }

  onExist(handler: (path: string) => Promise<boolean>) {
    return ipcMain.handle(Channels.exist, (_ev, path) => handler(path));
  }

  // mkdir
  async mkdir(path: string): Promise<void> {
    return ipcRenderer.invoke(Channels.mkdir, path);
  }

  onMkdir(handler: (path: string) => Promise<void>) {
    return ipcMain.handle(Channels.mkdir, (_ev, path) => handler(path));
  }

  // rmdir
  async rmdir(path: string): Promise<boolean> {
    return ipcRenderer.invoke(Channels.rmdir, path);
  }

  onRmdir(handler: (path: string) => Promise<boolean>) {
    return ipcMain.handle(Channels.rmdir, (_ev, path) => handler(path));
  }

  // rm
  async rm(path: string): Promise<void> {
    return ipcRenderer.invoke(Channels.rm, path);
  }

  onRm(handler: (path: string) => Promise<void>) {
    return ipcMain.handle(Channels.rm, (_ev, path) => handler(path));
  }

  // write
  async write(path: string, text: string): Promise<void> {
    return ipcRenderer.invoke(Channels.write, path, text);
  }

  onWrite(handler: (path: string, text: string) => Promise<void>) {
    return ipcMain.handle(Channels.write, (_ev, path, text) => handler(path, text));
  }

  // read
  async read(path: string): Promise<string> {
    return ipcRenderer.invoke(Channels.read, path);
  }

  onRead(handler: (path: string) => Promise<string>) {
    return ipcMain.handle(Channels.read, (_ev, path) => handler(path));
  }
}

export const FSIPC = new _FSIPC();
