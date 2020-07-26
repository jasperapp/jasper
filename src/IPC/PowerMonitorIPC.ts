// import {BrowserWindow, ipcRenderer} from 'electron';
//
// enum Channels {
//   suspend = 'suspend',
//   resume = 'resume',
// }

// only Linux and Windows
// https://www.electronjs.org/docs/api/power-monitor
class _PowerMonitorIPC {
  // private window: BrowserWindow;
  //
  // initWindow(window: BrowserWindow) {
  //   this.window = window;
  // }
  //
  // suspend() {
  //   this.window.webContents.send(Channels.suspend);
  // }
  //
  // onSuspend(handler: () => void) {
  //   ipcRenderer.on(Channels.suspend, handler);
  // }
  //
  // resume() {
  //   this.window.webContents.send(Channels.resume);
  // }
  //
  // onResume(handler: () => void) {
  //   ipcRenderer.on(Channels.resume, handler);
  // }
}

export const PowerMonitorIPC = new _PowerMonitorIPC();
