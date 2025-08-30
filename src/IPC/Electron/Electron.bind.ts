import {clipboard, ipcMain, shell} from 'electron';
import {ElectronChannel} from './Electron.channel';

export function electronBind() {
  ipcMain.on(ElectronChannel.clipboard, (_e, text: string) => {
    clipboard.writeText(text);
  });
  ipcMain.on(ElectronChannel.showItemInFolder, (_e, path: string) => {
    shell.showItemInFolder(path);
  });
  ipcMain.on(ElectronChannel.openExternal, (_e, url: string) => {
    shell.openExternal(url);
  });
}
