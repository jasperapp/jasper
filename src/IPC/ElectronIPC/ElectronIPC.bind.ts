import {clipboard, ipcMain, shell} from 'electron';
import {ElectronIPCChannel} from './ElectronIPC.channel';

export function electronIPCBind() {
  ipcMain.handle(ElectronIPCChannel.clipboard, (_e, text: string) => {
    return clipboard.writeText(text);
  });

  ipcMain.handle(ElectronIPCChannel.showItemInFolder, (_e, path: string) => {
    return shell.showItemInFolder(path);
  });

  ipcMain.handle(ElectronIPCChannel.openExternal, (_e, url: string) => {
    return shell.openExternal(url);
  });
}
