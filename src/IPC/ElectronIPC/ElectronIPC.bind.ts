import {clipboard, ipcMain, shell} from 'electron';
import {ElectronIPCChannel} from './ElectronIPC.channel';

export function electronIPCBind() {
  ipcMain.on(ElectronIPCChannel.clipboard, (_e, text: string) => {
    clipboard.writeText(text);
  });
  ipcMain.on(ElectronIPCChannel.showItemInFolder, (_e, path: string) => {
    shell.showItemInFolder(path);
  });
  ipcMain.on(ElectronIPCChannel.openExternal, (_e, url: string) => {
    shell.openExternal(url);
  });
}
