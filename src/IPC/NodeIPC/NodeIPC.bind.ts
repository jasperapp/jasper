import {ipcMain} from 'electron';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import {NodeIPCChannel} from './NodeIPC.channel';

export function nodeIPCBind() {
  ipcMain.on(NodeIPCChannel.normalize, (e, path: string) => {
    e.returnValue = nodePath.normalize(path);
  });
  ipcMain.on(NodeIPCChannel.resolve, (e, paths: string[]) => {
    e.returnValue = nodePath.resolve(...paths);
  });
  ipcMain.on(NodeIPCChannel.readFileSync, (e, p: string) => {
    e.returnValue = nodeFs.readFileSync(nodePath.join(__dirname, p)).toString();
  });
}
