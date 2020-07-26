// import {ipcMain, ipcRenderer} from 'electron';
//
// enum Channels {
//   enable = 'KeyboardShortcutIPC:enable',
// }

class _KeyboardShortcutIPC {
  // keyboardShortcut(enable: boolean) {
  //   ipcRenderer.send(Channels.enable, enable);
  // }
  //
  // onEnable(handler: (_ev, enable: boolean) => void) {
  //   ipcMain.on(Channels.enable, handler);
  // }
}

export const KeyboardShortcutIPC = new _KeyboardShortcutIPC();
