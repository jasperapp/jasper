import {BrowserWindow, ipcMain, ipcRenderer} from 'electron';

enum Channels {
  stopAllStreams = 'StreamIPC:stopAllStream',
  restartAllStreams = 'StreamIPC:restartAllStreams',
  unreadCount = 'StreamIPC:unreadCount',
  exportStreams = 'StreamIPC:exportStreams',
  importStreams = 'StreamIPC:importStreams',
}

class _StreamIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // stop all streams
  async stopAllStreams() {
    this.window.webContents.send(Channels.stopAllStreams);
  }

  async onStopAllStreams(handler: () => void) {
    ipcRenderer.on(Channels.stopAllStreams, handler);
  }

  // restart all streams
  async restartAllStreams() {
    this.window.webContents.send(Channels.restartAllStreams);
  }

  async onRestartAllStreams(handler: () => void) {
    ipcRenderer.on(Channels.restartAllStreams, handler);
  }

  // set unread count
  setUnreadCount(unreadCount: number, badge: boolean) {
    ipcRenderer.send(Channels.unreadCount, unreadCount, badge);
  }

  onSetUnreadCount(handler: (_ev, unreadCount: number, badge: boolean) => void) {
    ipcMain.on(Channels.unreadCount, handler);
  }

  // export streams
  async exportStreams(streamSettings: any[]) {
    return ipcRenderer.invoke(Channels.exportStreams, streamSettings);
  }

  onExportStreams(handler: (_ev, streamSettings: any[]) => Promise<void>) {
    ipcMain.handle(Channels.exportStreams, handler);
  };

  // import streams
  async importStreams(): Promise<{streamSettings?: any[]}> {
    return ipcRenderer.invoke(Channels.importStreams);
  }

  onImportStreams(handler: () => Promise<{streamSettings?: any[]}>) {
    ipcMain.handle(Channels.importStreams, handler);
  };
}

export const StreamIPC = new _StreamIPC();
