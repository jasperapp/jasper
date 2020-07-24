import {AppWindow} from '../Main/AppWindow';
import {ipcRenderer} from 'electron';

enum Channels {
  appEnd = 'appEnd',
  appActive = 'appActive',
  appDeActive = 'appDeActive',
  menu = 'menu',
}

class _GAIPC {
  // app end
  eventAppEnd() {
    AppWindow.getWindow().webContents.send(Channels.appEnd);
  }

  onEventAppEnd(handler: () => void) {
    ipcRenderer.on(Channels.appEnd, handler);
  }

  // app active
  eventAppActive() {
    AppWindow.getWindow().webContents.send(Channels.appActive);
  }

  onEventAppActive(handler: () => void) {
    ipcRenderer.on(Channels.appActive, handler);
  }

  // app de active
  eventAppDeActive() {
    AppWindow.getWindow().webContents.send(Channels.appDeActive);
  }

  onEventDeAppActive(handler: () => void) {
    ipcRenderer.on(Channels.appDeActive, handler);
  }

  // menu
  eventMenu(name: string) {
    AppWindow.getWindow().webContents.send(Channels.menu, name);
  }

  onEventMenu(handler: (_ev, name: string) => void) {
    ipcRenderer.on(Channels.menu, handler);
  }
}

export const GAIPC = new _GAIPC();
