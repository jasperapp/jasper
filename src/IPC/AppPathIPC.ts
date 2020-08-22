import {ipcMain, ipcRenderer} from 'electron';

enum Channels {
  appDataPath = 'AppPathIPC:appDataPath',
  userDataPath = 'AppPathIPC:userDataPath',
  prefDataDir = 'AppPathIPC:prefDataDir',
  prefDataPath = 'AppPathIPC:prefDataPath',
  absPath = 'AppPathIPC:absPath',
}

class _AppPathIPC {
  // app data path
  async getAppDataPath(): Promise<string> {
    return ipcRenderer.invoke(Channels.appDataPath);
  }

  onGetAppDataPath(handler: () => Promise<string>) {
    return ipcMain.handle(Channels.appDataPath, (_ev) => handler());
  }

  // user data path
  async getUserDataPath(): Promise<string> {
    return ipcRenderer.invoke(Channels.userDataPath);
  }

  onGetUserDataPath(handler: () => Promise<string>) {
    return ipcMain.handle(Channels.userDataPath, (_ev) => handler());
  }

  // pref path
  async getPrefPath(): Promise<string> {
    return ipcRenderer.invoke(Channels.prefDataPath);
  }

  onGetPrefPath(handler: () => Promise<string>) {
    return ipcMain.handle(Channels.prefDataPath, (_ev) => handler());
  }

  // pref dir
  async getPrefDir(): Promise<string> {
    return ipcRenderer.invoke(Channels.prefDataDir);
  }

  onGetPrefDir(handler: () => Promise<string>) {
    return ipcMain.handle(Channels.prefDataDir, (_ev) => handler());
  }

  // abs path
  async getAbsPath(path: string, currentFilePath: string): Promise<string> {
    return ipcRenderer.invoke(Channels.absPath, path, currentFilePath);
  }

  onGetAbsPath(handler: (path: string, currentFilePath: string) => Promise<string>) {
    return ipcMain.handle(Channels.absPath, (_ev, path, parent) => handler(path, parent));
  }
}

export const AppPathIPC = new _AppPathIPC();
