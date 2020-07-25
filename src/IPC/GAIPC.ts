import {BrowserWindow, ipcRenderer} from 'electron';

enum Channels {
  appEnd = 'appEnd',
  appActive = 'appActive',
  appDeActive = 'appDeActive',
  menu = 'menu',
}

class _GAIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // app end
  eventAppEnd() {
    this.window.webContents.send(Channels.appEnd);
  }

  onEventAppEnd(handler: () => void) {
    ipcRenderer.on(Channels.appEnd, handler);
  }

  // app active
  eventAppActive() {
    this.window.webContents.send(Channels.appActive);
  }

  onEventAppActive(handler: () => void) {
    ipcRenderer.on(Channels.appActive, handler);
  }

  // app de active
  eventAppDeActive() {
    this.window.webContents.send(Channels.appDeActive);
  }

  onEventDeAppActive(handler: () => void) {
    ipcRenderer.on(Channels.appDeActive, handler);
  }

  // menu
  eventMenu(name: string) {
    this.window.webContents.send(Channels.menu, name);
  }

  onEventMenu(handler: (_ev, name: string) => void) {
    ipcRenderer.on(Channels.menu, handler);
  }
}

export const GAIPC = new _GAIPC();
