import {BrowserWindow, ipcMain, ipcRenderer} from 'electron';

enum Channels {
  openNewWindow = 'AppIPC:openNewWindow',
  deleteAllData = 'AppIPC:deleteAllData',
  keyboardShortcut = 'AppIPC:KeyboardShortcutIPC',
  powerMonitorSuspend = 'AppIPC:powerMonitorSuspend',
  powerMonitorResume = 'AppIPC:powerMonitorResume',
}

class _AppIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // open new window
  async openNewWindow(webHost: string, https: boolean) {
    return ipcRenderer.invoke(Channels.openNewWindow, webHost, https);
  }

  onOpenNewWindow(handler: (_ev, webHost: string, https: boolean) => Promise<void>) {
    ipcMain.handle(Channels.openNewWindow, handler);
  }

  // delete all data
  async deleteAllData() {
    return ipcRenderer.invoke(Channels.deleteAllData);
  }

  onDeleteAllData(handler: () => Promise<void>) {
    ipcMain.handle(Channels.deleteAllData, handler);
  }

  // keyboard shortcut
  keyboardShortcut(enable: boolean) {
    ipcRenderer.send(Channels.keyboardShortcut, enable);
  }

  onKeyboardShortcut(handler: (_ev, enable: boolean) => void) {
    ipcMain.on(Channels.keyboardShortcut, handler);
  }

  // power monitor suspend
  // only Linux and Windows
  // https://www.electronjs.org/docs/api/power-monitor
  powerMonitorSuspend() {
    this.window.webContents.send(Channels.powerMonitorSuspend);
  }

  onPowerMonitorSuspend(handler: () => void) {
    ipcRenderer.on(Channels.powerMonitorSuspend, handler);
  }

  // power monitor resume
  // only Linux and Windows
  // https://www.electronjs.org/docs/api/power-monitor
  powerMonitorResume() {
    this.window.webContents.send(Channels.powerMonitorResume);
  }

  onPowerMonitorResume(handler: () => void) {
    ipcRenderer.on(Channels.powerMonitorResume, handler);
  }
}

export const AppIPC = new _AppIPC();
